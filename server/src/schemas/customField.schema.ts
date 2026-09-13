import { z } from 'zod';

export const customFieldEntityEnum = z.enum(['LEAD', 'CONTACT', 'COMPANY', 'DEAL']);
export const customFieldTypeEnum = z.enum(['TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT']);

export const createCustomFieldSchema = z.object({
  entity: customFieldEntityEnum,
  label: z.string().min(1).max(80),
  fieldKey: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'fieldKey must start with a letter and contain only letters, numbers, underscores'),
  type: customFieldTypeEnum,
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
});

export const setCustomFieldValueSchema = z.object({
  customFieldId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
  value: z.string().max(2000).nullable(),
});
