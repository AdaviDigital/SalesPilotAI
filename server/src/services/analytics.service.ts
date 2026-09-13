import { prisma } from '../config/prisma';

export async function getLeadAnalytics(organizationId: string) {
  const [total, bySourceRaw, byStatusRaw] = await Promise.all([
    prisma.lead.count({ where: { organizationId, deletedAt: null } }),
    prisma.lead.groupBy({ by: ['source'], where: { organizationId, deletedAt: null }, _count: true }),
    prisma.lead.groupBy({ by: ['status'], where: { organizationId, deletedAt: null }, _count: true }),
  ]);

  const converted = byStatusRaw.find((s) => s.status === 'CONVERTED')?._count ?? 0;
  const qualified = byStatusRaw.find((s) => s.status === 'QUALIFIED')?._count ?? 0;

  // Source performance: conversion rate per source.
  const sourcePerformance = await Promise.all(
    bySourceRaw.map(async (s) => {
      const convertedForSource = await prisma.lead.count({
        where: { organizationId, deletedAt: null, source: s.source, status: 'CONVERTED' },
      });
      return {
        source: s.source ?? 'Unknown',
        leadCount: s._count,
        conversionRate: s._count ? Math.round((convertedForSource / s._count) * 100) : 0,
      };
    }),
  );

  return {
    totalLeads: total,
    qualificationRate: total ? Math.round((qualified / total) * 100) : 0,
    conversionRate: total ? Math.round((converted / total) * 100) : 0,
    bySource: sourcePerformance,
    byStatus: byStatusRaw.map((s) => ({ status: s.status, count: s._count })),
  };
}

export async function getSalesAnalytics(organizationId: string) {
  const [won, lost, open] = await Promise.all([
    prisma.deal.aggregate({ where: { organizationId, status: 'won' }, _sum: { value: true }, _count: true, _avg: { value: true } }),
    prisma.deal.count({ where: { organizationId, status: 'lost' } }),
    prisma.deal.aggregate({ where: { organizationId, status: 'open' }, _sum: { value: true }, _count: true }),
  ]);

  const totalClosed = (won._count ?? 0) + lost;

  const wonWithDates = await prisma.deal.findMany({
    where: { organizationId, status: 'won', actualCloseDate: { not: null } },
    select: { createdAt: true, actualCloseDate: true },
  });
  const cycles = wonWithDates.map((d) => (d.actualCloseDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const avgSalesCycleDays = cycles.length ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : null;

  return {
    totalRevenue: Math.round(Number(won._sum.value ?? 0)),
    winRate: totalClosed ? Math.round(((won._count ?? 0) / totalClosed) * 100) : 0,
    averageDealSize: Math.round(Number(won._avg.value ?? 0)),
    avgSalesCycleDays,
    openPipelineValue: Math.round(Number(open._sum.value ?? 0)),
    openDealCount: open._count,
    wonDealCount: won._count,
    lostDealCount: lost,
  };
}

export async function getTeamAnalytics(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId, status: 'active' },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });

  return Promise.all(
    members.map(async (m) => {
      const [calls, emails, meetings, wonDeals, allDeals] = await Promise.all([
        prisma.activity.count({ where: { organizationId, userId: m.userId, type: 'CALL' } }),
        prisma.activity.count({ where: { organizationId, userId: m.userId, type: 'EMAIL' } }),
        prisma.activity.count({ where: { organizationId, userId: m.userId, type: 'MEETING' } }),
        prisma.deal.aggregate({ where: { organizationId, ownerId: m.userId, status: 'won' }, _sum: { value: true }, _count: true }),
        prisma.deal.count({ where: { organizationId, ownerId: m.userId, status: { in: ['won', 'lost'] } } }),
      ]);
      return {
        userId: m.userId,
        name: `${m.user.firstName} ${m.user.lastName}`,
        role: m.role,
        calls,
        emails,
        meetings,
        dealsWon: wonDeals._count,
        revenue: Math.round(Number(wonDeals._sum.value ?? 0)),
        conversionRate: allDeals ? Math.round(((wonDeals._count ?? 0) / allDeals) * 100) : 0,
      };
    }),
  );
}

export async function getPipelineFunnel(organizationId: string) {
  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId, isDefault: true },
    include: { stages: { orderBy: { order: 'asc' }, include: { deals: { where: { deletedAt: null }, select: { value: true } } } } },
  });
  if (!pipeline) return [];
  return pipeline.stages.map((s) => ({
    stage: s.name,
    dealCount: s.deals.length,
    totalValue: Math.round(s.deals.reduce((sum, d) => sum + Number(d.value), 0)),
  }));
}
