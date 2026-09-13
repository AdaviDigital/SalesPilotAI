import { z } from 'zod';

export const createDealSchema = z.object({
  name: z.string().min(1).max(160),
  companyId: z.string().uuid().optional().nullable(),
  primaryContactId: z.string().uuid().optional().nullable(),
  value: z.number().nonnegative().default(0),
  currency: z.string().length(3).default('USD'),
  pipelineId: z.string().uuid(),
  stageId: z.string().uuid(),
  probability: z.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().datetime().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  source: z.string().max(80).optional().nullable(),
  competitors: z.string().max(300).optional().nullable(),
  nextAction: z.string().max(300).optional().nullable(),
});

export const updateDealSchema = createDealSchema.partial();

export const moveDealSchema = z.object({
  stageId: z.string().uuid(),
});

export const listDealsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  pipelineId: z.string().uuid().optional(),
  stageId: z.string().uuid().optional(),
  status: z.enum(['open', 'won', 'lost']).optional(),
  ownerId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type ListDealsQuery = z.infer<typeof listDealsQuerySchema>;
