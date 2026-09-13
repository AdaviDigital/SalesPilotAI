import { prisma } from '../config/prisma';

export async function listPipelines(organizationId: string) {
  return prisma.pipeline.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
}

export async function getDefaultPipeline(organizationId: string) {
  const pipeline = await prisma.pipeline.findFirst({
    where: { organizationId, isDefault: true },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
  return pipeline ?? prisma.pipeline.findFirst({ where: { organizationId }, include: { stages: { orderBy: { order: 'asc' } } } });
}

export async function createStage(organizationId: string, pipelineId: string, input: { name: string; probability: number }) {
  const pipeline = await prisma.pipeline.findFirst({ where: { id: pipelineId, organizationId } });
  if (!pipeline) return null;

  const maxOrder = await prisma.pipelineStage.aggregate({ where: { pipelineId }, _max: { order: true } });
  return prisma.pipelineStage.create({
    data: { pipelineId, name: input.name, probability: input.probability, order: (maxOrder._max.order ?? -1) + 1 },
  });
}

export async function updateStage(organizationId: string, stageId: string, input: { name?: string; probability?: number }) {
  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipeline: { organizationId } } });
  if (!stage) return null;
  return prisma.pipelineStage.update({ where: { id: stageId }, data: input });
}

export async function deleteStage(organizationId: string, stageId: string) {
  const stage = await prisma.pipelineStage.findFirst({ where: { id: stageId, pipeline: { organizationId } }, include: { _count: { select: { deals: true } } } });
  if (!stage) return { status: 'not_found' as const };
  if (stage._count.deals > 0) return { status: 'has_deals' as const, dealCount: stage._count.deals };
  await prisma.pipelineStage.delete({ where: { id: stageId } });
  return { status: 'deleted' as const };
}

/** Sets `order` sequentially to match the given stageIds order. All stages must belong to the same org-owned pipeline. */
export async function reorderStages(organizationId: string, pipelineId: string, stageIds: string[]) {
  const pipeline = await prisma.pipeline.findFirst({ where: { id: pipelineId, organizationId }, include: { stages: true } });
  if (!pipeline) return null;

  const validIds = new Set(pipeline.stages.map((s) => s.id));
  if (stageIds.length !== pipeline.stages.length || !stageIds.every((id) => validIds.has(id))) return null;

  await prisma.$transaction(stageIds.map((id, index) => prisma.pipelineStage.update({ where: { id }, data: { order: index } })));
  return prisma.pipelineStage.findMany({ where: { pipelineId }, orderBy: { order: 'asc' } });
}
