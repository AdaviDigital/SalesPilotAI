import { z } from 'zod';

export const leadStatusEnum = z.enum([
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'UNQUALIFIED',
  'NURTURING',
  'CONVERTED',
  'LOST',
]);

export const createLeadSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  companyName: z.string().max(160).optional().nullable(),
  jobTitle: z.string().max(160).optional().nullable(),
  website: z.string().url().optional().nullable(),
  industry: z.string().max(80).optional().nullable(),
  location: z.string().max(160).optional().nullable(),
  source: z.string().max(80).optional().nullable(),
  status: leadStatusEnum.default('NEW'),
  estimatedValue: z.number().nonnegative().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: leadStatusEnum.optional(),
  ownerId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'leadScore', 'estimatedValue', 'lastContactedAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
