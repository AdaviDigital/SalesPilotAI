import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { CreateContactInput, ListContactsQuery, UpdateContactInput } from '../schemas/contact.schema';

export async function list(organizationId: string, query: ListContactsQuery) {
  const where: Prisma.ContactWhereInput = {
    organizationId,
    deletedAt: null,
    ...(query.companyId ? { companyId: query.companyId } : {}),
    ...(query.ownerId ? { ownerId: query.ownerId } : {}),
    ...(query.search
      ? {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function findById(organizationId: string, id: string) {
  return prisma.contact.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      company: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
      deals: true,
      activities: { orderBy: { occurredAt: 'desc' }, take: 20 },
      tasks: { orderBy: { dueDate: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } },
      tags: { include: { tag: true } },
    },
  });
}

export async function create(organizationId: string, input: CreateContactInput) {
  const { tagIds, ...data } = input;
  return prisma.contact.create({
    data: { ...data, organizationId, ...(tagIds?.length ? { tags: { create: tagIds.map((tagId) => ({ tagId })) } } : {}) },
  });
}

export async function update(organizationId: string, id: string, input: UpdateContactInput) {
  const { tagIds, ...data } = input;
  const existing = await prisma.contact.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) return null;
  return prisma.contact.update({
    where: { id },
    data: { ...data, ...(tagIds ? { tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } } : {}) },
  });
}

export async function softDelete(organizationId: string, id: string) {
  const existing = await prisma.contact.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) return null;
  return prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
}
