import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import * as pipelineRepo from '../repositories/pipeline.repository';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { recordAudit } from '../utils/audit';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await pipelineRepo.listPipelines(req.organizationId!));
  } catch (err) {
    next(err);
  }
}

const createStageSchema = z.object({
  name: z.string().min(1).max(80),
  probability: z.number().min(0).max(100).default(0),
});

async function createStage(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createStageSchema.parse(req.body);
    const stage = await pipelineRepo.createStage(req.organizationId!, req.params.pipelineId, input);
    if (!stage) throw new AppError('Pipeline not found', 404);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'pipeline_stage.created', resourceId: stage.id, metadata: { name: stage.name }, ipAddress: req.ip });
    res.status(201).json(stage);
  } catch (err) {
    next(err);
  }
}

const updateStageSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  probability: z.number().min(0).max(100).optional(),
});

async function updateStage(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateStageSchema.parse(req.body);
    const stage = await pipelineRepo.updateStage(req.organizationId!, req.params.stageId, input);
    if (!stage) throw new AppError('Stage not found', 404);
    res.json(stage);
  } catch (err) {
    next(err);
  }
}

async function deleteStage(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await pipelineRepo.deleteStage(req.organizationId!, req.params.stageId);
    if (result.status === 'not_found') throw new AppError('Stage not found', 404);
    if (result.status === 'has_deals') {
      throw new AppError(`Cannot delete — ${result.dealCount} deal(s) are still in this stage. Move them first.`, 409);
    }
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'pipeline_stage.deleted', resourceId: req.params.stageId, ipAddress: req.ip });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const reorderSchema = z.object({ stageIds: z.array(z.string().uuid()).min(1) });

async function reorderStages(req: Request, res: Response, next: NextFunction) {
  try {
    const { stageIds } = reorderSchema.parse(req.body);
    const stages = await pipelineRepo.reorderStages(req.organizationId!, req.params.pipelineId, stageIds);
    if (!stages) throw new AppError('Invalid pipeline or stage list', 400);
    res.json(stages);
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth, requireOrganization);

router.get('/', list);
router.post('/:pipelineId/stages', requireRole('OWNER', 'ADMIN'), createStage);
router.patch('/stages/:stageId', requireRole('OWNER', 'ADMIN'), updateStage);
router.delete('/stages/:stageId', requireRole('OWNER', 'ADMIN'), deleteStage);
router.patch('/:pipelineId/stages/reorder', requireRole('OWNER', 'ADMIN'), reorderStages);

export default router;
