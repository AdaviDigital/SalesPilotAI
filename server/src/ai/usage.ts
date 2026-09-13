import { prisma } from '../config/prisma';

// Rough per-1K-token blended cost estimate for display purposes only — not
// used for actual billing, which should reconcile against provider invoices.
const COST_PER_1K_TOKENS: Record<string, number> = {
  openai: 0.01,
  anthropic: 0.008,
  google: 0.005,
  demo: 0,
};

export async function recordAIUsage(
  organizationId: string,
  params: { operation: string; provider: string; model?: string; promptTokens: number; completionTokens: number; userId?: string },
) {
  const rate = COST_PER_1K_TOKENS[params.provider] ?? 0.01;
  const estimatedCostUsd = ((params.promptTokens + params.completionTokens) / 1000) * rate;

  await prisma.aIUsage.create({
    data: {
      organizationId,
      userId: params.userId,
      operation: params.operation,
      provider: params.provider,
      model: params.model,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      estimatedCostUsd,
    },
  });
}
