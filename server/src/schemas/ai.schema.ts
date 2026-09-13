import { z } from 'zod';

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(2000),
});

export const generateEmailSchema = z.object({
  intent: z.enum(['cold_email', 'follow_up', 'rewrite', 'shorten', 'meeting_follow_up', 'proposal_follow_up', 'reactivation']),
  tone: z.enum(['Professional', 'Friendly', 'Persuasive', 'Concise', 'Consultative', 'Executive', 'Urgent']).default('Professional'),
  context: z.string().min(1).max(2000),
  existingEmail: z.string().max(5000).optional(),
});

export const summarizeCustomerSchema = z.object({
  entity: z.enum(['contact', 'company']),
  id: z.string().uuid(),
});

export const analyzeConversationParamsSchema = z.object({
  activityId: z.string().uuid(),
});
