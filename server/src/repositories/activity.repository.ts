import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { CreateActivityInput, ListActivitiesQuery } from '../schemas/activity.schema';

export async function list(organizationId: string, query: ListActivitiesQuery) {
  const where: Prisma.ActivityWhereInput = {
    organizationId,
    ...(query.type ? { type: query.type } : {}),
    ...(query.leadId ? { leadId: query.leadId } : {}),
    ...(query.contactId ? { contactId: query.contactId } : {}),
    ...(query.companyId ? { companyId: query.companyId } : {}),
    ...(query.dealId ? { dealId: query.dealId } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, name: true } },
      },
    }),
    prisma.activity.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function create(organizationId: string, userId: string, input: CreateActivityInput) {
  const activity = await prisma.activity.create({
    data: {
      ...input,
      organizationId,
      userId,
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    },
  });

  // Touch lastContactedAt on the related lead when this is an outreach-type activity.
  if (input.leadId && ['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP'].includes(input.type)) {
    await prisma.lead.update({ where: { id: input.leadId }, data: { lastContactedAt: new Date() } }).catch(() => {});
  }

  return activity;
}

export async function findById(organizationId: string, id: string) {
  return prisma.activity.findFirst({ where: { id, organizationId } });
}

export async function remove(organizationId: string, id: string) {
  const existing = await prisma.activity.findFirst({ where: { id, organizationId } });
  if (!existing) return null;
  return prisma.activity.delete({ where: { id } });
}

/** All activities within a date range for calendar rendering (meetings/calls). */
export async function listInRange(organizationId: string, start: Date, end: Date) {
  return prisma.activity.findMany({
    where: { organizationId, occurredAt: { gte: start, lte: end }, type: { in: ['CALL', 'MEETING'] } },
    orderBy: { occurredAt: 'asc' },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, name: true } },
    },
  });
}
