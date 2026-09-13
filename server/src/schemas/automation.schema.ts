import { z } from 'zod';

export const automationTriggerSchema = z.object({
  entityType: z.enum(['lead', 'deal', 'task', 'contact']),
  eventType: z.enum(['status_changed', 'inactive_for_days', 'created', 'stage_changed']),
  config: z.record(z.unknown()),
});

export const automationActionSchema = z.object({
  actionType: z.enum(['create_task', 'notify_owner', 'generate_ai_email', 'mark_at_risk', 'schedule_reminder']),
  config: z.record(z.unknown()),
  order: z.number().int().min(0).default(0),
});

export const createAutomationSchema = z.object({
  name: z.string().min(1).max(160),
  isActive: z.boolean().default(true),
  triggers: z.array(automationTriggerSchema).min(1),
  actions: z.array(automationActionSchema).min(1),
});

export const updateAutomationSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;
