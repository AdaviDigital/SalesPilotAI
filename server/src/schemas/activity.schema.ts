import { z } from 'zod';

export const activityTypeEnum = z.enum(['CALL', 'EMAIL', 'MEETING', 'NOTE', 'FOLLOW_UP', 'TASK']);

export const createActivitySchema = z
  .object({
    type: activityTypeEnum,
    subject: z.string().min(1).max(200),
    body: z.string().max(5000).optional().nullable(),
    leadId: z.string().uuid().optional().nullable(),
    contactId: z.string().uuid().optional().nullable(),
    companyId: z.string().uuid().optional().nullable(),
    dealId: z.string().uuid().optional().nullable(),
    occurredAt: z.string().datetime().optional(),
  })
  .refine((data) => data.leadId || data.contactId || data.companyId || data.dealId, {
    message: 'An activity must be linked to at least one lead, contact, company, or deal',
  });

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  type: activityTypeEnum.optional(),
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
