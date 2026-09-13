import { prisma } from '../config/prisma';
import { getAIProvider } from '../ai';
import { recordAIUsage } from './usage';

interface ScoringInputs {
  hasEmail: boolean;
  hasPhone: boolean;
  source: string | null;
  estimatedValue: number | null;
  daysSinceCreated: number;
  activityCount: number;
  emailActivityCount: number;
  meetingActivityCount: number;
}

const SOURCE_WEIGHTS: Record<string, number> = {
  Referral: 20,
  LinkedIn: 15,
  Website: 10,
  'Cold Outreach': 5,
};

/**
 * Deterministic scoring so lead scores are always available — no AI key
 * required. This is the same rationale as the AI demo-mode fallback:
 * scoring is core CRM functionality, not an AI-gated feature.
 */
export function computeHeuristicScore(inputs: ScoringInputs): { score: number; engagement: number; intent: string } {
  let score = 30; // baseline

  if (inputs.hasEmail) score += 8;
  if (inputs.hasPhone) score += 5;
  if (inputs.source) score += SOURCE_WEIGHTS[inputs.source] ?? 5;
  if (inputs.estimatedValue) score += Math.min(20, Math.round(inputs.estimatedValue / 5000));

  const engagement = Math.min(100, inputs.activityCount * 8 + inputs.emailActivityCount * 4 + inputs.meetingActivityCount * 15);
  score += Math.round(engagement * 0.3);

  if (inputs.daysSinceCreated > 30 && inputs.activityCount === 0) score -= 15;

  score = Math.max(0, Math.min(100, score));

  const intent = inputs.meetingActivityCount > 0 ? 'High' : inputs.emailActivityCount > 1 ? 'Medium' : 'Low';

  return { score, engagement, intent };
}

function temperatureFor(score: number): 'HOT' | 'WARM' | 'COLD' {
  if (score >= 75) return 'HOT';
  if (score >= 45) return 'WARM';
  return 'COLD';
}

function recommendedActionFor(score: number, engagement: number): string {
  if (score >= 75) return 'Prioritize immediate outreach — schedule a call this week.';
  if (score >= 45 && engagement < 20) return 'Send a personalized follow-up email to re-engage.';
  if (score >= 45) return 'Continue nurturing — propose a product demo.';
  return 'Add to a low-touch nurture sequence; revisit in 30 days.';
}

export async function scoreLead(organizationId: string, leadId: string) {
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizationId, deletedAt: null },
    include: { activities: true },
  });
  if (!lead) throw new Error('Lead not found');

  const daysSinceCreated = Math.floor((Date.now() - lead.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const inputs: ScoringInputs = {
    hasEmail: !!lead.email,
    hasPhone: !!lead.phone,
    source: lead.source,
    estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
    daysSinceCreated,
    activityCount: lead.activities.length,
    emailActivityCount: lead.activities.filter((a) => a.type === 'EMAIL').length,
    meetingActivityCount: lead.activities.filter((a) => a.type === 'MEETING').length,
  };

  const { score, engagement, intent } = computeHeuristicScore(inputs);
  const temperature = temperatureFor(score);
  const recommendedAction = recommendedActionFor(score, engagement);

  // Optional: ask the configured AI provider for a one-sentence human-readable
  // rationale. If no provider is configured, fall back to a generated
  // explanation from the heuristic inputs — scoring never blocks on AI.
  let explanation = `Score reflects ${inputs.activityCount} recorded activities, ${lead.source ?? 'an unknown'} source, and ${
    inputs.estimatedValue ? `an estimated value of $${inputs.estimatedValue.toLocaleString()}` : 'no stated deal value'
  }.`;

  try {
    const provider = getAIProvider();
    if (provider.name !== 'demo') {
      const result = await provider.complete({
        messages: [
          { role: 'system', content: 'You are a sales analyst. Explain a lead score in one concise sentence, no preamble.' },
          {
            role: 'user',
            content: `Lead: ${lead.firstName} ${lead.lastName} at ${lead.companyName ?? 'unknown company'}. Score: ${score}/100. Source: ${lead.source ?? 'unknown'}. Activities: ${inputs.activityCount}. Estimated value: ${inputs.estimatedValue ?? 'unknown'}.`,
          },
        ],
        maxTokens: 100,
      });
      if (result.content) explanation = result.content.trim();
      await recordAIUsage(organizationId, { operation: 'lead_scoring', provider: provider.name, promptTokens: result.promptTokens, completionTokens: result.completionTokens });
    }
  } catch {
    // AI enhancement failed — heuristic explanation above already stands in.
  }

  return prisma.lead.update({
    where: { id: leadId },
    data: {
      leadScore: score,
      engagementScore: engagement,
      buyingIntent: intent,
      temperature,
      recommendedAction,
      aiScoreExplanation: explanation,
      aiScoredAt: new Date(),
      conversionProbability: score / 100,
    },
  });
}

export async function scoreAllLeads(organizationId: string) {
  const leads = await prisma.lead.findMany({ where: { organizationId, deletedAt: null, status: { notIn: ['CONVERTED', 'LOST'] } }, select: { id: true } });
  const results = [];
  // Sequential to respect AI provider rate limits when one is configured.
  for (const lead of leads) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await scoreLead(organizationId, lead.id));
  }
  return results;
}
