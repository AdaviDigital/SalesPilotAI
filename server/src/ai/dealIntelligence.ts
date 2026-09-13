import { prisma } from '../config/prisma';
import { getAIProvider } from '../ai';
import { recordAIUsage } from './usage';

export async function analyzeDeal(organizationId: string, dealId: string) {
  const deal = await prisma.deal.findFirst({
    where: { id: dealId, organizationId, deletedAt: null },
    include: { activities: { orderBy: { occurredAt: 'desc' }, take: 1 }, stage: true },
  });
  if (!deal) throw new Error('Deal not found');

  const lastActivity = deal.activities[0];
  const daysSinceLastActivity = lastActivity
    ? Math.floor((Date.now() - lastActivity.occurredAt.getTime()) / (1000 * 60 * 60 * 24))
    : Math.floor((Date.now() - deal.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  const daysToClose = deal.expectedCloseDate
    ? Math.floor((deal.expectedCloseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  const reasons: string[] = [];

  if (daysSinceLastActivity > 14) {
    riskLevel = 'high';
    reasons.push(`no customer interaction recorded for ${daysSinceLastActivity} days`);
  } else if (daysSinceLastActivity > 7) {
    riskLevel = 'medium';
    reasons.push(`activity has slowed — last touch ${daysSinceLastActivity} days ago`);
  }

  if (daysToClose !== null && daysToClose < 7 && daysToClose >= 0 && deal.probability < 60) {
    riskLevel = 'high';
    reasons.push(`expected close date is in ${daysToClose} days with low win probability`);
  }
  if (daysToClose !== null && daysToClose < 0) {
    riskLevel = 'high';
    reasons.push(`expected close date has passed`);
  }

  const health = riskLevel === 'high' ? 'at_risk' : riskLevel === 'medium' ? 'needs_attention' : 'healthy';

  let closeProbability = deal.probability / 100;
  if (riskLevel === 'high') closeProbability = Math.max(0.05, closeProbability - 0.25);
  if (riskLevel === 'medium') closeProbability = Math.max(0.1, closeProbability - 0.1);

  const recommendedAction =
    riskLevel === 'high'
      ? 'Reach out today — schedule a call to re-confirm interest and timeline.'
      : riskLevel === 'medium'
        ? 'Send a check-in email this week to keep momentum.'
        : 'On track — continue with the current cadence.';

  let explanation =
    reasons.length > 0
      ? `${riskLevel === 'high' ? 'High risk' : 'Moderate risk'}: ${reasons.join('; ')}.`
      : 'Deal is progressing normally with recent engagement.';

  try {
    const provider = getAIProvider();
    if (provider.name !== 'demo') {
      const result = await provider.complete({
        messages: [
          { role: 'system', content: 'You are a sales analyst. Explain deal risk in one concise sentence, no preamble.' },
          {
            role: 'user',
            content: `Deal "${deal.name}" worth $${Number(deal.value).toLocaleString()}, stage "${deal.stage.name}", ${daysSinceLastActivity} days since last activity, ${daysToClose ?? 'unknown'} days to expected close, current probability ${deal.probability}%.`,
          },
        ],
        maxTokens: 100,
      });
      if (result.content) explanation = result.content.trim();
      await recordAIUsage(organizationId, { operation: 'deal_intelligence', provider: provider.name, promptTokens: result.promptTokens, completionTokens: result.completionTokens });
    }
  } catch {
    // heuristic explanation stands in
  }

  return prisma.deal.update({
    where: { id: dealId },
    data: {
      aiHealth: health,
      aiCloseProbability: closeProbability,
      aiRiskLevel: riskLevel,
      aiVelocityDaysInStage: daysSinceLastActivity,
      aiRecommendedAction: recommendedAction,
      aiExplanation: explanation,
      aiScoredAt: new Date(),
    },
  });
}

export async function analyzeAllOpenDeals(organizationId: string) {
  const deals = await prisma.deal.findMany({ where: { organizationId, status: 'open', deletedAt: null }, select: { id: true } });
  const results = [];
  for (const deal of deals) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await analyzeDeal(organizationId, deal.id));
  }
  return results;
}
