import { prisma } from '../config/prisma';
import { createNotification } from './notification.service';
import { generateEmail } from '../ai/emailAssistant';

type AutomationConfig = Record<string, unknown>;

interface AutomationAction {
  actionType: string;
  config: AutomationConfig;
  order?: number;
}

interface AutomationContext {
  leadId?: string;
  dealId?: string;
  ownerId?: string | null;
}

function getString(
  config: AutomationConfig,
  key: string,
): string | undefined {
  const value = config[key];
  return typeof value === 'string' ? value : undefined;
}

function getNumber(
  config: AutomationConfig,
  key: string,
): number | undefined {
  const value = config[key];

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

/**
 * Runs the configured actions for one automation.
 *
 * Actions are a fixed, whitelisted set (see automation.schema.ts) — there is
 * no arbitrary code execution here, only pre-defined side effects with
 * validated configuration.
 */
async function runActions(
  organizationId: string,
  actions: AutomationAction[],
  context: AutomationContext,
) {
  const orderedActions = [...actions].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  for (const action of orderedActions) {
    const { config } = action;

    switch (action.actionType) {
      case 'create_task': {
        const title =
          getString(config, 'title') ?? 'Automated follow-up';

        const dueInDays = getNumber(config, 'dueInDays');

        const priority =
          getString(config, 'priority') ?? 'MEDIUM';

        // eslint-disable-next-line no-await-in-loop
        await prisma.task.create({
          data: {
            organizationId,
            title,
            dueDate:
              dueInDays !== undefined
                ? new Date(
                    Date.now() + dueInDays * 86400000,
                  )
                : undefined,
            leadId: context.leadId,
            dealId: context.dealId,
            assigneeId: context.ownerId ?? undefined,
            priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          },
        });

        break;
      }

      case 'notify_owner': {
        if (context.ownerId) {
          const title =
            getString(config, 'title') ??
            'Automation triggered';

          const body = getString(config, 'body');

          // eslint-disable-next-line no-await-in-loop
          await createNotification(
            organizationId,
            context.ownerId,
            {
              type: 'workflow_alert',
              title,
              body,
            },
          );
        }

        break;
      }

      case 'generate_ai_email': {
        if (context.leadId) {
          // eslint-disable-next-line no-await-in-loop
          const lead = await prisma.lead.findUnique({
            where: {
              id: context.leadId,
            },
          });

          if (lead) {
            // eslint-disable-next-line no-await-in-loop
            const draft = await generateEmail({
              organizationId,
              intent: 'follow_up',
              tone: 'Professional',
              context: `Follow up with ${lead.firstName} ${lead.lastName} at ${
                lead.companyName ?? 'their company'
              }, status: ${lead.status}.`,
            });

            // eslint-disable-next-line no-await-in-loop
            await prisma.activity.create({
              data: {
                organizationId,
                type: 'EMAIL',
                subject: `[AI Draft] ${draft.subject}`,
                body: draft.body,
                leadId: context.leadId,
              },
            });
          }
        }

        break;
      }

      case 'mark_at_risk': {
        if (context.dealId) {
          // eslint-disable-next-line no-await-in-loop
          await prisma.deal.update({
            where: {
              id: context.dealId,
            },
            data: {
              aiHealth: 'at_risk',
            },
          });
        }

        break;
      }

      case 'schedule_reminder': {
        if (context.ownerId) {
          const title =
            getString(config, 'title') ?? 'Reminder';

          const body = getString(config, 'body');

          // eslint-disable-next-line no-await-in-loop
          await createNotification(
            organizationId,
            context.ownerId,
            {
              type: 'task_reminder',
              title,
              body,
            },
          );
        }

        break;
      }

      default:
        break;
    }
  }
}

/**
 * Called after a lead's status is updated.
 * Fires matching status_changed automations.
 */
export async function evaluateLeadStatusChange(
  organizationId: string,
  leadId: string,
  newStatus: string,
  ownerId: string | null,
) {
  const automations = await prisma.automation.findMany({
    where: {
      organizationId,
      isActive: true,
      triggers: {
        some: {
          entityType: 'lead',
          eventType: 'status_changed',
        },
      },
    },
    include: {
      triggers: true,
      actions: true,
    },
  });

  for (const automation of automations) {
    const matches = automation.triggers.some((trigger) => {
      if (
        trigger.entityType !== 'lead' ||
        trigger.eventType !== 'status_changed'
      ) {
        return false;
      }

      const config = trigger.config;

      if (
        config === null ||
        typeof config !== 'object' ||
        Array.isArray(config)
      ) {
        return false;
      }

      const triggerConfig = config as AutomationConfig;

      return (
        getString(triggerConfig, 'toStatus') === newStatus
      );
    });

    if (matches) {
      // eslint-disable-next-line no-await-in-loop
      await runActions(
        organizationId,
        automation.actions.map((action) => ({
          actionType: action.actionType,
          config:
            action.config !== null &&
            typeof action.config === 'object' &&
            !Array.isArray(action.config)
              ? (action.config as AutomationConfig)
              : {},
          order: action.order,
        })),
        {
          leadId,
          ownerId,
        },
      );
    }
  }
}

/**
 * Manual/scheduled sweep for "inactive for N days" deal triggers.
 *
 * In a real deployment this is invoked by a platform cron
 * (Render Cron Jobs, a Vercel Cron route, or a system crontab on Hostinger)
 * hitting POST /api/automation/run-inactivity-check on a schedule.
 *
 * The logic itself has no platform dependency.
 */
export async function runInactivityCheck(
  organizationId: string,
) {
  const automations = await prisma.automation.findMany({
    where: {
      organizationId,
      isActive: true,
      triggers: {
        some: {
          entityType: 'deal',
          eventType: 'inactive_for_days',
        },
      },
    },
    include: {
      triggers: true,
      actions: true,
    },
  });

  let dealsFlagged = 0;

  for (const automation of automations) {
    const trigger = automation.triggers.find(
      (item) =>
        item.entityType === 'deal' &&
        item.eventType === 'inactive_for_days',
    );

    if (!trigger) {
      continue;
    }

    let triggerConfig: AutomationConfig = {};

    if (
      trigger.config !== null &&
      typeof trigger.config === 'object' &&
      !Array.isArray(trigger.config)
    ) {
      triggerConfig = trigger.config as AutomationConfig;
    }

    const days = getNumber(triggerConfig, 'days') ?? 7;

    const cutoff = new Date(
      Date.now() - days * 86400000,
    );

    // eslint-disable-next-line no-await-in-loop
    const deals = await prisma.deal.findMany({
      where: {
        organizationId,
        status: 'open',
        deletedAt: null,
        updatedAt: {
          lt: cutoff,
        },
        activities: {
          none: {
            occurredAt: {
              gte: cutoff,
            },
          },
        },
      },
    });

    for (const deal of deals) {
      // eslint-disable-next-line no-await-in-loop
      await runActions(
        organizationId,
        automation.actions.map((action) => ({
          actionType: action.actionType,
          config:
            action.config !== null &&
            typeof action.config === 'object' &&
            !Array.isArray(action.config)
              ? (action.config as AutomationConfig)
              : {},
          order: action.order,
        })),
        {
          dealId: deal.id,
          ownerId: deal.ownerId,
        },
      );

      dealsFlagged += 1;
    }
  }

  return {
    dealsFlagged,
  };
}