import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import type { CreateDealInput, ListDealsQuery, UpdateDealInput } from '../schemas/deal.schema';

export async function list(organizationId: string, query: ListDealsQuery) {
  const where: Prisma.DealWhereInput = {
    organizationId,
    deletedAt: null,
    ...(query.pipelineId ? { pipelineId: query.pipelineId } : {}),
    ...(query.stageId ? { stageId: query.stageId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.ownerId ? { ownerId: query.ownerId } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        company: { select: { id: true, name: true } },
        primaryContact: { select: { id: true, firstName: true, lastName: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        stage: true,
      },
    }),
    prisma.deal.count({ where }),
  ]);

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function findById(organizationId: string, id: string) {
  return prisma.deal.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      company: true,
      primaryContact: true,
      owner: { select: { id: true, firstName: true, lastName: true } },
      pipeline: { include: { stages: { orderBy: { order: 'asc' } } } },
      stage: true,
      activities: { orderBy: { occurredAt: 'desc' }, take: 20 },
      tasks: { orderBy: { dueDate: 'asc' } },
      notes: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function create(organizationId: string, input: CreateDealInput) {
  const stage = await prisma.pipelineStage.findFirst({ where: { id: input.stageId, pipeline: { organizationId } } });
  return prisma.deal.create({
    data: {
      ...input,
      organizationId,
      probability: input.probability ?? stage?.probability ?? 0,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
    },
  });
}

export async function update(organizationId: string, id: string, input: UpdateDealInput) {
  const existing = await prisma.deal.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) return null;
  return prisma.deal.update({
    where: { id },
    data: { ...input, expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined },
  });
}

export async function moveStage(organizationId: string, id: string, stageId: string) {
  const deal = await prisma.deal.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!deal) return null;
  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipeline: { organizationId } } });
  if (!stage) return null;

  return prisma.deal.update({
    where: { id },
    data: {
      stageId,
      probability: stage.probability,
      status: stage.isWon ? 'won' : stage.isLost ? 'lost' : 'open',
      actualCloseDate: stage.isWon || stage.isLost ? new Date() : null,
    },
  });
}

export async function softDelete(organizationId: string, id: string) {
  const existing = await prisma.deal.findFirst({ where: { id, organizationId, deletedAt: null } });
  if (!existing) return null;
  return prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
}
