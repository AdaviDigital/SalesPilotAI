import { prisma } from '../config/prisma';
import type { AIToolDefinition } from './AIProvider';
import type { Prisma } from '@prisma/client';

/**
 * Every tool here is scoped by organizationId taken from the authenticated
 * request context — never from a model-supplied argument. This is what
 * prevents a prompt injection in CRM data from escalating into cross-tenant
 * access: the LLM can request "getDeals" but cannot choose whose deals.
 */

export const AI_TOOL_DEFINITIONS: AIToolDefinition[] = [
  {
    name: 'getLeads',
    description:
      'List leads for the current organization, optionally filtered by status or temperature.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: [
            'NEW',
            'CONTACTED',
            'QUALIFIED',
            'UNQUALIFIED',
            'NURTURING',
            'CONVERTED',
            'LOST',
          ],
        },
        temperature: {
          type: 'string',
          enum: ['HOT', 'WARM', 'COLD'],
        },
        limit: {
          type: 'number',
          description: 'Max results, default 20',
        },
      },
    },
  },
  {
    name: 'getDeals',
    description: 'List open/won/lost deals for the current organization.',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['open', 'won', 'lost'],
        },
        limit: {
          type: 'number',
        },
      },
    },
  },
  {
    name: 'getContacts',
    description: 'List contacts for the current organization.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
        },
      },
    },
  },
  {
    name: 'getCompanies',
    description: 'List companies/accounts for the current organization.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
        },
      },
    },
  },
  {
    name: 'getSalesMetrics',
    description:
      'Get aggregate sales metrics: total revenue, win rate, average deal size, conversion rate.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getPipeline',
    description:
      'Get the default sales pipeline with deal counts and value per stage.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getActivities',
    description:
      'Get recent sales activities (calls, emails, meetings) for the organization.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
        },
      },
    },
  },
  {
    name: 'getTeamPerformance',
    description:
      'Get per-rep performance: deals won, revenue, activity count.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'createTask',
    description: 'Create a follow-up task.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
        },
        dueDate: {
          type: 'string',
          description: 'ISO date',
        },
        dealId: {
          type: 'string',
        },
        leadId: {
          type: 'string',
        },
      },
      required: ['title'],
    },
  },
];

interface ToolContext {
  organizationId: string;
  userId: string;
}

export async function executeAITool(
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  const limit =
    typeof args.limit === 'number'
      ? Math.min(Math.max(Math.floor(args.limit), 1), 50)
      : 20;

  switch (name) {
    case 'getLeads': {
      const status =
        typeof args.status === 'string'
          ? (args.status as Prisma.LeadWhereInput['status'])
          : undefined;

      const temperature =
        typeof args.temperature === 'string'
          ? (args.temperature as Prisma.LeadWhereInput['temperature'])
          : undefined;

      return prisma.lead.findMany({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          ...(status ? { status } : {}),
          ...(temperature ? { temperature } : {}),
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          companyName: true,
          status: true,
          leadScore: true,
          temperature: true,
          estimatedValue: true,
        },
      });
    }

    case 'getDeals': {
      const status =
        typeof args.status === 'string'
          ? args.status
          : undefined;

      return prisma.deal.findMany({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
          ...(status ? { status } : {}),
        },
        take: limit,
        orderBy: {
          updatedAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          value: true,
          probability: true,
          status: true,
          expectedCloseDate: true,
          stage: {
            select: {
              name: true,
            },
          },
        },
      });
    }

    case 'getContacts':
      return prisma.contact.findMany({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
        },
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      });

    case 'getCompanies':
      return prisma.company.findMany({
        where: {
          organizationId: ctx.organizationId,
          deletedAt: null,
        },
        take: limit,
        select: {
          id: true,
          name: true,
          industry: true,
          companySize: true,
        },
      });

    case 'getSalesMetrics': {
      const [won, lost, open] = await Promise.all([
        prisma.deal.aggregate({
          where: {
            organizationId: ctx.organizationId,
            status: 'won',
          },
          _sum: {
            value: true,
          },
          _count: true,
          _avg: {
            value: true,
          },
        }),

        prisma.deal.count({
          where: {
            organizationId: ctx.organizationId,
            status: 'lost',
          },
        }),

        prisma.deal.aggregate({
          where: {
            organizationId: ctx.organizationId,
            status: 'open',
          },
          _sum: {
            value: true,
          },
          _count: true,
        }),
      ]);

      const totalClosed = (won._count ?? 0) + lost;

      return {
        wonDeals: won._count,
        lostDeals: lost,
        winRate: totalClosed
          ? Math.round(((won._count ?? 0) / totalClosed) * 100)
          : 0,
        totalWonRevenue: won._sum.value ?? 0,
        averageDealSize: won._avg.value ?? 0,
        openDeals: open._count,
        openPipelineValue: open._sum.value ?? 0,
      };
    }

    case 'getPipeline': {
      const pipeline = await prisma.pipeline.findFirst({
        where: {
          organizationId: ctx.organizationId,
          isDefault: true,
        },
        include: {
          stages: {
            orderBy: {
              order: 'asc',
            },
            include: {
              deals: {
                where: {
                  deletedAt: null,
                },
                select: {
                  value: true,
                },
              },
            },
          },
        },
      });

      return pipeline?.stages.map((stage) => ({
        stage: stage.name,
        dealCount: stage.deals.length,
        totalValue: stage.deals.reduce(
          (sum, deal) => sum + Number(deal.value),
          0,
        ),
      }));
    }

    case 'getActivities':
      return prisma.activity.findMany({
        where: {
          organizationId: ctx.organizationId,
        },
        take: limit,
        orderBy: {
          occurredAt: 'desc',
        },
        select: {
          id: true,
          type: true,
          subject: true,
          occurredAt: true,
        },
      });

    case 'getTeamPerformance': {
      const members = await prisma.organizationMember.findMany({
        where: {
          organizationId: ctx.organizationId,
          status: 'active',
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return Promise.all(
        members.map(async (member) => {
          const [wonDeals, activityCount] = await Promise.all([
            prisma.deal.aggregate({
              where: {
                organizationId: ctx.organizationId,
                ownerId: member.userId,
                status: 'won',
              },
              _sum: {
                value: true,
              },
              _count: true,
            }),

            prisma.activity.count({
              where: {
                organizationId: ctx.organizationId,
                userId: member.userId,
              },
            }),
          ]);

          return {
            rep: `${member.user.firstName} ${member.user.lastName}`,
            dealsWon: wonDeals._count,
            revenue: wonDeals._sum.value ?? 0,
            activities: activityCount,
          };
        }),
      );
    }

    case 'createTask': {
      const task = await prisma.task.create({
        data: {
          organizationId: ctx.organizationId,
          title: typeof args.title === 'string' ? args.title : '',
          dueDate:
            typeof args.dueDate === 'string'
              ? new Date(args.dueDate)
              : undefined,
          dealId:
            typeof args.dealId === 'string'
              ? args.dealId
              : undefined,
          leadId:
            typeof args.leadId === 'string'
              ? args.leadId
              : undefined,
          assigneeId: ctx.userId,
        },
      });

      return {
        created: true,
        taskId: task.id,
      };
    }

    default:
      return {
        error: `Unknown tool: ${name}`,
      };
  }
}