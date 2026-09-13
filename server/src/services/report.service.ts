import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { ReportConfig } from '../schemas/report.schema';

function rangeStart(dateRange: ReportConfig['dateRange']): Date | null {
  const now = new Date();

  switch (dateRange) {
    case 'last_7_days':
      return new Date(now.getTime() - 7 * 86400000);

    case 'last_30_days':
      return new Date(now.getTime() - 30 * 86400000);

    case 'last_90_days':
      return new Date(now.getTime() - 90 * 86400000);

    case 'this_month':
      return new Date(now.getFullYear(), now.getMonth(), 1);

    case 'this_quarter':
      return new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1,
      );

    case 'this_year':
      return new Date(now.getFullYear(), 0, 1);

    default:
      return null;
  }
}

export async function runReport(
  organizationId: string,
  config: ReportConfig,
) {
  const since = rangeStart(config.dateRange);

  if (config.metric === 'revenue' || config.metric === 'deal_count') {
    const deals = await prisma.deal.findMany({
      where: {
        organizationId,
        status: 'won',
        deletedAt: null,
        ...(since ? { actualCloseDate: { gte: since } } : {}),
      },
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        stage: true,
      },
    });

    const groups = new Map<string, { value: number; count: number }>();

    deals.forEach((deal) => {
      const key =
        config.dimension === 'owner'
          ? deal.owner
            ? `${deal.owner.firstName} ${deal.owner.lastName}`
            : 'Unassigned'
          : config.dimension === 'stage'
            ? deal.stage.name
            : config.dimension === 'month'
              ? `${deal.actualCloseDate?.getFullYear()}-${String(
                  (deal.actualCloseDate?.getMonth() ?? 0) + 1,
                ).padStart(2, '0')}`
              : 'All';

      const entry = groups.get(key) ?? {
        value: 0,
        count: 0,
      };

      entry.value += Number(deal.value);
      entry.count += 1;

      groups.set(key, entry);
    });

    return Array.from(groups.entries()).map(([label, value]) => ({
      label,
      value:
        config.metric === 'revenue'
          ? Math.round(value.value)
          : value.count,
    }));
  }

  if (
    config.metric === 'lead_count' ||
    config.metric === 'conversion_rate'
  ) {
    const leads = await prisma.lead.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    });

    const groups = new Map<
      string,
      {
        total: number;
        converted: number;
      }
    >();

    leads.forEach((lead) => {
      const key =
        config.dimension === 'source'
          ? lead.source ?? 'Unknown'
          : config.dimension === 'industry'
            ? lead.industry ?? 'Unknown'
            : 'All';

      const entry = groups.get(key) ?? {
        total: 0,
        converted: 0,
      };

      entry.total += 1;

      if (lead.status === 'CONVERTED') {
        entry.converted += 1;
      }

      groups.set(key, entry);
    });

    return Array.from(groups.entries()).map(([label, value]) => ({
      label,
      value:
        config.metric === 'lead_count'
          ? value.total
          : value.total
            ? Math.round((value.converted / value.total) * 100)
            : 0,
    }));
  }

  const activities = await prisma.activity.findMany({
    where: {
      organizationId,
      ...(since ? { occurredAt: { gte: since } } : {}),
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const groups = new Map<string, number>();

  activities.forEach((activity) => {
    const key =
      config.dimension === 'owner'
        ? activity.user
          ? `${activity.user.firstName} ${activity.user.lastName}`
          : 'Unassigned'
        : activity.type;

    groups.set(key, (groups.get(key) ?? 0) + 1);
  });

  return Array.from(groups.entries()).map(([label, value]) => ({
    label,
    value,
  }));
}

export async function listReports(organizationId: string) {
  return prisma.report.findMany({
    where: {
      organizationId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

export async function createReport(
  organizationId: string,
  name: string,
  config: ReportConfig,
) {
  return prisma.report.create({
    data: {
      organizationId,
      name,
      config: config as Prisma.InputJsonValue,
    },
  });
}

export async function deleteReport(
  organizationId: string,
  id: string,
) {
  const existing = await prisma.report.findFirst({
    where: {
      id,
      organizationId,
    },
  });

  if (!existing) {
    return null;
  }

  return prisma.report.delete({
    where: {
      id,
    },
  });
}