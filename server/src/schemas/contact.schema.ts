import { z } from 'zod';

export const createContactSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  jobTitle: z.string().max(160).optional().nullable(),
  companyId: z.string().uuid().optional().nullable(),
  source: z.string().max(80).optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateContactSchema = createContactSchema.partial();

export const listContactsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  companyId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'lastName']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ListContactsQuery = z.infer<typeof listContactsQuerySchema>;
