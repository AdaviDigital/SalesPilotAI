import { prisma } from '../config/prisma';

export async function getForecast(organizationId: string) {
  const [openDeals, wonDeals, lostDeals] = await Promise.all([
    prisma.deal.findMany({ where: { organizationId, status: 'open', deletedAt: null }, select: { value: true, probability: true, expectedCloseDate: true, createdAt: true } }),
    prisma.deal.findMany({ where: { organizationId, status: 'won' }, select: { value: true, createdAt: true, actualCloseDate: true } }),
    prisma.deal.count({ where: { organizationId, status: 'lost' } }),
  ]);

  const weightedPipeline = openDeals.reduce((sum, d) => sum + Number(d.value) * (d.probability / 100), 0);
  const bestCase = openDeals.reduce((sum, d) => sum + Number(d.value), 0);
  const commit = openDeals.filter((d) => d.probability >= 70).reduce((sum, d) => sum + Number(d.value), 0);

  const totalClosed = wonDeals.length + lostDeals;
  const winRate = totalClosed ? Math.round((wonDeals.length / totalClosed) * 100) : 0;

  const closedRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value), 0);
  const averageDealSize = wonDeals.length ? closedRevenue / wonDeals.length : 0;

  const cycleDurationsDays = wonDeals
    .filter((d) => d.actualCloseDate)
    .map((d) => (d.actualCloseDate!.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const avgSalesCycleDays = cycleDurationsDays.length
    ? Math.round(cycleDurationsDays.reduce((a, b) => a + b, 0) / cycleDurationsDays.length)
    : null;

  // Pipeline coverage: how many multiples of a target the current weighted
  // pipeline represents. Without a stored quota, use closed revenue trend as
  // a stand-in target so the metric is still meaningful out of the box.
  const pipelineCoverage = closedRevenue > 0 ? Number((weightedPipeline / closedRevenue).toFixed(2)) : null;

  const now = new Date();
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const revenueByMonth = new Map<string, number>();
  wonDeals.forEach((d) => {
    const key = monthKey(d.actualCloseDate ?? d.createdAt);
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + Number(d.value));
  });

  const forecastByMonth = new Map<string, number>();
  openDeals.forEach((d) => {
    const key = monthKey(d.expectedCloseDate ?? now);
    forecastByMonth.set(key, (forecastByMonth.get(key) ?? 0) + Number(d.value) * (d.probability / 100));
  });

  return {
    weightedPipeline: Math.round(weightedPipeline),
    bestCase: Math.round(bestCase),
    commitForecast: Math.round(commit),
    closedRevenue: Math.round(closedRevenue),
    winRate,
    averageDealSize: Math.round(averageDealSize),
    avgSalesCycleDays,
    pipelineCoverage,
    openDealCount: openDeals.length,
    revenueByMonth: Array.from(revenueByMonth.entries()).sort().map(([month, revenue]) => ({ month, revenue: Math.round(revenue) })),
    forecastByMonth: Array.from(forecastByMonth.entries()).sort().map(([month, forecast]) => ({ month, forecast: Math.round(forecast) })),
  };
}
