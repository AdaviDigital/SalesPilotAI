import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { CreateLeadInput, ListLeadsQuery, UpdateLeadInput } from '../schemas/lead.schema';

// Every method here takes organizationId as an explicit, required argument
// and threads it into the `where` clause. No query in this file may omit it
// — that constraint is what enforces multi-tenant isolation at the data
// layer, independent of anything the route/controller does.

export async function list(organizationId: string, query: ListLeadsQuery) {
  const where: Prisma.LeadWhereInput = {
    organizationId,
    deletedAt: null,
    ...(query.status ? { status: query.status } : {}),
    ...(query.ownerId ? { ownerId: query.ownerId } : {}),
    ...(query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { companyName: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { owner: { select: { id: true, firstName: true, lastName: true } }, tags: { include: { tag: true } } },
    }),
    prisma.lead.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function findById(organizationId: string, id: string) {
  return prisma.lead.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
      tags: { include: { tag: true } },
      activities: { orderBy: { occurredAt: 'desc' }, take: 20 },
      tasks: { orderBy: { dueDate: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function create(organizationId: string, input: CreateLeadInput) {
  const { tagIds, ...data } = input;
  return prisma.lead.create({
    data: {
      ...data,
      organizationId,
      ...(tagIds?.length ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } } : {}),
    },
  });
}

export async function update(organizationId: string, id: string, input: UpdateLeadInput) {
  const { tagIds, ...data } = input;
  // scoped findFirst first to guarantee the row belongs to this org before writing
  const existing = await prisma.lead.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) return null;

  return prisma.lead.update({
    where: { id },
    data: {
      ...data,
      ...(tagIds
        ? { tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } }
        : {}),
    },
  });
}

export async function softDelete(organizationId: string, id: string) {
  const existing = await prisma.lead.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) return null;
  return prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function findDuplicateByEmail(organizationId: string, email: string) {
  return prisma.lead.findFirst({ where: { organizationId, email, deletedAt: null } });
}

/** Groups leads by normalized email where more than one lead shares that email. */
export async function findDuplicateGroups(organizationId: string) {
  const leads = await prisma.lead.findMany({
    where: { organizationId, deletedAt: null, email: { not: null } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, firstName: true, lastName: true, email: true, companyName: true, status: true, leadScore: true, createdAt: true },
  });

  const groups = new Map<string, typeof leads>();
  for (const lead of leads) {
    const key = lead.email!.toLowerCase().trim();
    groups.set(key, [...(groups.get(key) ?? []), lead]);
  }

  return Array.from(groups.entries())
    .filter(([, group]) => group.length > 1)
    .map(([email, group]) => ({ email, leads: group }));
}

/**
 * Merges `mergeIds` into `keepId`: reassigns activities, tasks, and notes
 * from the merged leads onto the kept lead, then soft-deletes the merged
 * leads. All within a transaction so a partial merge can never be left
 * half-applied.
 */
export async function mergeLeads(organizationId: string, keepId: string, mergeIds: string[]) {
  const ids = mergeIds.filter((id) => id !== keepId);
  if (ids.length === 0) return null;

  return prisma.$transaction(async (tx) => {
    const keep = await tx.lead.findFirst({ where: { id: keepId, organizationId, deletedAt: null } });
    if (!keep) return null;

    const toMerge = await tx.lead.findMany({ where: { id: { in: ids }, organizationId, deletedAt: null } });
    if (toMerge.length === 0) return null;
    const validIds = toMerge.map((l) => l.id);

    await tx.activity.updateMany({ where: { leadId: { in: validIds } }, data: { leadId: keepId } });
    await tx.task.updateMany({ where: { leadId: { in: validIds } }, data: { leadId: keepId } });
    await tx.note.updateMany({ where: { leadId: { in: validIds } }, data: { leadId: keepId } });
    await tx.lead.updateMany({ where: { id: { in: validIds } }, data: { deletedAt: new Date() } });

    return tx.lead.findUnique({ where: { id: keepId } });
  });
}
