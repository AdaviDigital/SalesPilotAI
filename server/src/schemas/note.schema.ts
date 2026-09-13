import { z } from 'zod';

export const createNoteSchema = z
  .object({
    body: z.string().min(1).max(5000),
    leadId: z.string().uuid().optional().nullable(),
    contactId: z.string().uuid().optional().nullable(),
    companyId: z.string().uuid().optional().nullable(),
    dealId: z.string().uuid().optional().nullable(),
  })
  .refine(
    (data) =>
      data.leadId ||
      data.contactId ||
      data.companyId ||
      data.dealId,
    {
      message:
        'A note must be linked to at least one lead, contact, company, or deal',
    }
  );

export const listNotesQuerySchema = z.object({
  leadId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  dealId: z.string().uuid().optional(),
});

/**
 * TypeScript types inferred directly from the Zod schemas.
 */
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;