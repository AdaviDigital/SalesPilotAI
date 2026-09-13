import { getAIProvider } from '../ai';
import { recordAIUsage } from './usage';

export type EmailTone = 'Professional' | 'Friendly' | 'Persuasive' | 'Concise' | 'Consultative' | 'Executive' | 'Urgent';
export type EmailIntent = 'cold_email' | 'follow_up' | 'rewrite' | 'shorten' | 'meeting_follow_up' | 'proposal_follow_up' | 'reactivation';

interface GenerateEmailParams {
  organizationId: string;
  intent: EmailIntent;
  tone: EmailTone;
  context: string; // recipient/company/deal context the caller supplies
  existingEmail?: string; // required for rewrite/shorten
  userId?: string;
}

const INTENT_INSTRUCTIONS: Record<EmailIntent, string> = {
  cold_email: 'Write a cold outreach email introducing the product to a new prospect.',
  follow_up: 'Write a follow-up email after no response to a previous message.',
  rewrite: 'Rewrite the provided email to be more effective while preserving its core message.',
  shorten: 'Shorten the provided email to its essential points, no more than 5 sentences.',
  meeting_follow_up: 'Write a follow-up email after a sales meeting, recapping key points and next steps.',
  proposal_follow_up: 'Write a follow-up email checking in on a sent proposal.',
  reactivation: 'Write a re-engagement email for a prospect who has gone cold.',
};

export async function generateEmail(params: GenerateEmailParams): Promise<{ subject: string; body: string }> {
  const provider = getAIProvider();

  const instruction = INTENT_INSTRUCTIONS[params.intent];
  const systemPrompt = `You are an expert B2B sales copywriter. ${instruction} Tone: ${params.tone}. Respond ONLY as JSON: {"subject": "...", "body": "..."}. No markdown, no preamble.`;

  const userContent = params.existingEmail
    ? `Context: ${params.context}\n\nExisting email to work from:\n${params.existingEmail}`
    : `Context: ${params.context}`;

  const result = await provider.complete({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    maxTokens: 500,
  });

  await recordAIUsage(params.organizationId, {
    operation: 'email_generation',
    provider: provider.name,
    promptTokens: result.promptTokens,
    completionTokens: result.completionTokens,
    userId: params.userId,
  });

  if (!result.content) {
    return { subject: '(AI unavailable)', body: 'AI service is temporarily unavailable. Please try again later.' };
  }

  try {
    const cleaned = result.content.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return { subject: parsed.subject ?? '', body: parsed.body ?? cleaned };
  } catch {
    // Model didn't return clean JSON (common in demo mode) — fall back to raw content as the body.
    return { subject: `Re: ${params.context.slice(0, 60)}`, body: result.content };
  }
}
