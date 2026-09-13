import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1).max(160),
  website: z.string().url().optional().nullable(),
  industry: z.string().max(80).optional().nullable(),
  companySize: z.string().max(40).optional().nullable(),
  annualRevenue: z.number().nonnegative().optional().nullable(),
  location: z.string().max(160).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable(),
  ownerId: z.string().uuid().optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  ownerId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(['createdAt', 'name', 'annualRevenue']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
