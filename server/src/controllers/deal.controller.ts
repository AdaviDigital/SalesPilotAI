import type { NextFunction, Request, Response } from 'express';
import { createDealSchema, listDealsQuerySchema, moveDealSchema, updateDealSchema } from '../schemas/deal.schema';
import * as dealService from '../services/deal.service';
import { recordAudit } from '../utils/audit';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listDealsQuerySchema.parse(req.query);
    res.json(await dealService.listDeals(req.organizationId!, query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await dealService.getDeal(req.organizationId!, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createDealSchema.parse(req.body);
    const deal = await dealService.createDeal(req.organizationId!, input);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'deal.created', resourceType: 'deal', resourceId: deal.id, ipAddress: req.ip });
    res.status(201).json(deal);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateDealSchema.parse(req.body);
    const deal = await dealService.updateDeal(req.organizationId!, req.params.id, input);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'deal.updated', resourceType: 'deal', resourceId: deal.id, ipAddress: req.ip });
    res.json(deal);
  } catch (err) {
    next(err);
  }
}

export async function move(req: Request, res: Response, next: NextFunction) {
  try {
    const { stageId } = moveDealSchema.parse(req.body);
    const deal = await dealService.moveDealStage(req.organizationId!, req.params.id, stageId);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'deal.stage_changed',
      resourceType: 'deal',
      resourceId: deal.id,
      metadata: { stageId },
      ipAddress: req.ip,
    });
    res.json(deal);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await dealService.deleteDeal(req.organizationId!, req.params.id);
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'deal.deleted', resourceType: 'deal', resourceId: req.params.id, ipAddress: req.ip });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
