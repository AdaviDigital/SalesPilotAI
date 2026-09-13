import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { CreateCompanyInput, ListCompaniesQuery, UpdateCompanyInput } from '../schemas/company.schema';

export async function list(organizationId: string, query: ListCompaniesQuery) {
  const where: Prisma.CompanyWhereInput = {
    organizationId,
    deletedAt: null,
    ...(query.ownerId ? { ownerId: query.ownerId } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.company.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { contacts: true, deals: true } },
      },
    }),
    prisma.company.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function findById(organizationId: string, id: string) {
  return prisma.company.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      owner: { select: { id: true, firstName: true, lastName: true } },
      contacts: true,
      deals: true,
      activities: { orderBy: { occurredAt: 'desc' }, take: 20 },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function create(organizationId: string, input: CreateCompanyInput) {
  return prisma.company.create({ data: { ...input, organizationId } });
}

export async function update(organizationId: string, id: string, input: UpdateCompanyInput) {
  const existing = await prisma.company.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) return null;
  return prisma.company.update({ where: { id }, data: input });
}

export async function softDelete(organizationId: string, id: string) {
  const existing = await prisma.company.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) return null;
  return prisma.company.update({ where: { id }, data: { deletedAt: new Date() } });
}
