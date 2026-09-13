import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { CreateNoteInput, ListNotesQuery } from '../schemas/note.schema';

export async function list(organizationId: string, query: ListNotesQuery) {
  const where: Prisma.NoteWhereInput = {
    organizationId,
    ...(query.leadId ? { leadId: query.leadId } : {}),
    ...(query.contactId ? { contactId: query.contactId } : {}),
    ...(query.companyId ? { companyId: query.companyId } : {}),
    ...(query.dealId ? { dealId: query.dealId } : {}),
  };

  return prisma.note.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, firstName: true, lastName: true } } },
  });
}

export async function create(organizationId: string, userId: string, input: CreateNoteInput) {
  return prisma.note.create({ data: { ...input, organizationId, userId } });
}

export async function remove(organizationId: string, id: string) {
  const existing = await prisma.note.findFirst({ where: { id, organizationId } });
  if (!existing) return null;
  return prisma.note.delete({ where: { id } });
}
