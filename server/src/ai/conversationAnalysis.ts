import { prisma } from '../config/prisma';
import { getAIProvider } from '../ai';
import { recordAIUsage } from './usage';

interface AnalysisResult {
  sentiment: string;
  objections: string[];
  buyingSignals: string[];
  competitorsMentioned: string[];
  actionItems: string[];
}

export async function analyzeConversation(organizationId: string, activityId: string, userId?: string): Promise<AnalysisResult> {
  const activity = await prisma.activity.findFirst({ where: { id: activityId, organizationId } });
  if (!activity) throw new Error('Activity not found');
  if (!activity.body) throw new Error('Activity has no transcript/notes to analyze');

  const provider = getAIProvider();
  let result: AnalysisResult = {
    sentiment: 'unknown',
    objections: [],
    buyingSignals: [],
    competitorsMentioned: [],
    actionItems: [],
  };

  if (provider.name !== 'demo') {
    const completion = await provider.complete({
      messages: [
        {
          role: 'system',
          content:
            'You analyze sales conversation notes. Respond ONLY as JSON: {"sentiment": "positive|neutral|negative", "objections": [...], "buyingSignals": [...], "competitorsMentioned": [...], "actionItems": [...]}. Keep each array item short. No markdown, no preamble.',
        },
        { role: 'user', content: activity.body },
      ],
      maxTokens: 500,
    });
    await recordAIUsage(organizationId, { operation: 'conversation_analysis', provider: provider.name, promptTokens: completion.promptTokens, completionTokens: completion.completionTokens, userId });

    if (completion.content) {
      try {
        const parsed = JSON.parse(completion.content.replace(/```json|```/g, '').trim());
        result = {
          sentiment: parsed.sentiment ?? 'unknown',
          objections: parsed.objections ?? [],
          buyingSignals: parsed.buyingSignals ?? [],
          competitorsMentioned: parsed.competitorsMentioned ?? [],
          actionItems: parsed.actionItems ?? [],
        };
      } catch {
        // leave defaults if the model didn't return clean JSON
      }
    }
  }

  await prisma.activity.update({
    where: { id: activityId },
    data: {
      aiSentiment: result.sentiment,
      aiObjections: result.objections,
      aiBuyingSignals: result.buyingSignals,
      aiCompetitorsMentioned: result.competitorsMentioned,
      aiActionItems: result.actionItems,
      aiAnalyzedAt: new Date(),
    },
  });

  return result;
}
