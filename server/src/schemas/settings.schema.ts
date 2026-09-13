import { z } from 'zod';

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(160).optional(),
  logoUrl: z.string().url().optional().nullable(),
  industry: z.string().max(80).optional().nullable(),
  teamSize: z.enum(['1-5', '6-20', '21-50', '51-200', '200+']).optional().nullable(),
  timezone: z.string().max(80).optional(),
  currency: z.enum(['NGN', 'USD', 'GBP', 'EUR', 'CAD', 'AUD']).optional(),
});

export const updateOrganizationSettingsSchema = z.object({
  aiProvider: z.enum(['openai', 'anthropic', 'google', 'none']).optional(),
  aiModel: z.string().max(80).optional().nullable(),
  aiEnabled: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});
