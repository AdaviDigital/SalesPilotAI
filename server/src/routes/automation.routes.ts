import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import {
  createAutomationSchema,
  updateAutomationSchema,
} from '../schemas/automation.schema';
import { prisma } from '../config/prisma';
import { runInactivityCheck } from '../services/automation.service';
import {
  requireAuth,
  requireOrganization,
  requireRole,
} from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { recordAudit } from '../utils/audit';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const automations = await prisma.automation.findMany({
      where: {
        organizationId: req.organizationId!,
      },
      include: {
        triggers: true,
        actions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(automations);
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createAutomationSchema.parse(req.body);

    const automation = await prisma.automation.create({
      data: {
        organizationId: req.organizationId!,
        name: input.name,
        isActive: input.isActive,

        triggers: {
          create: input.triggers.map((trigger) => ({
            entityType: trigger.entityType,
            eventType: trigger.eventType,
            config: trigger.config as Prisma.InputJsonValue,
          })),
        },

        actions: {
          create: input.actions.map((action) => ({
            actionType: action.actionType,
            config: action.config as Prisma.InputJsonValue,
            order: action.order,
          })),
        },
      },

      include: {
        triggers: true,
        actions: true,
      },
    });

    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'automation.created',
      resourceType: 'automation',
      resourceId: automation.id,
      ipAddress: req.ip,
    });

    res.status(201).json(automation);
  } catch (err) {
    next(err);
  }
}

async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateAutomationSchema.parse(req.body);

    const existing = await prisma.automation.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.organizationId!,
      },
    });

    if (!existing) {
      throw new AppError('Automation not found', 404);
    }

    const automation = await prisma.automation.update({
      where: {
        id: req.params.id,
      },
      data: input,
    });

    res.json(automation);
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.automation.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.organizationId!,
      },
    });

    if (!existing) {
      throw new AppError('Automation not found', 404);
    }

    await prisma.automation.delete({
      where: {
        id: req.params.id,
      },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Manually trigger the inactivity sweep.
 * Intended to also be called by a platform cron on a schedule.
 */
async function runSweep(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await runInactivityCheck(req.organizationId!));
  } catch (err) {
    next(err);
  }
}

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', list);

router.post(
  '/',
  requireRole('OWNER', 'ADMIN', 'SALES_MANAGER'),
  create,
);

router.patch(
  '/:id',
  requireRole('OWNER', 'ADMIN', 'SALES_MANAGER'),
  update,
);

router.delete(
  '/:id',
  requireRole('OWNER', 'ADMIN', 'SALES_MANAGER'),
  remove,
);

router.post('/run-inactivity-check', runSweep);

export default router;