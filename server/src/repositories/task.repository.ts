import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../schemas/task.schema';

function viewFilter(view: ListTasksQuery['view'], userId: string): Prisma.TaskWhereInput {
  const now = new Date();
  switch (view) {
    case 'mine':
      return { assigneeId: userId };
    case 'overdue':
      return { dueDate: { lt: now }, status: { notIn: ['COMPLETED', 'CANCELLED'] } };
    case 'upcoming':
      return { dueDate: { gte: now }, status: { notIn: ['COMPLETED', 'CANCELLED'] } };
    case 'completed':
      return { status: 'COMPLETED' };
    case 'team':
    default:
      return {};
  }
}

export async function list(organizationId: string, userId: string, query: ListTasksQuery) {
  const where: Prisma.TaskWhereInput = {
    organizationId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    ...(query.dealId ? { dealId: query.dealId } : {}),
    ...(query.leadId ? { leadId: query.leadId } : {}),
    ...(query.contactId ? { contactId: query.contactId } : {}),
    ...viewFilter(query.view, userId),
  };

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: query.sortBy === 'priority' ? { priority: query.sortDir } : { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        deal: { select: { id: true, name: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function findById(organizationId: string, id: string) {
  return prisma.task.findFirst({
    where: { id, organizationId },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, name: true } },
    },
  });
}

export async function create(organizationId: string, input: CreateTaskInput) {
  return prisma.task.create({
    data: { ...input, organizationId, dueDate: input.dueDate ? new Date(input.dueDate) : undefined },
  });
}

export async function update(organizationId: string, id: string, input: UpdateTaskInput) {
  const existing = await prisma.task.findFirst({ where: { id, organizationId } });
  if (!existing) return null;
  const completingNow = input.status === 'COMPLETED' && existing.status !== 'COMPLETED';
  return prisma.task.update({
    where: { id },
    data: {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      completedAt: completingNow ? new Date() : input.status && input.status !== 'COMPLETED' ? null : undefined,
    },
  });
}

export async function remove(organizationId: string, id: string) {
  const existing = await prisma.task.findFirst({ where: { id, organizationId } });
  if (!existing) return null;
  return prisma.task.delete({ where: { id } });
}

/** All tasks/activities with a date in [start, end] for calendar rendering. */
export async function listInRange(organizationId: string, start: Date, end: Date) {
  return prisma.task.findMany({
    where: { organizationId, dueDate: { gte: start, lte: end } },
    orderBy: { dueDate: 'asc' },
    include: {
      assignee: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, name: true } },
      lead: { select: { id: true, firstName: true, lastName: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}
