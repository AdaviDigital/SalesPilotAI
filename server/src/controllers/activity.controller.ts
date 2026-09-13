import type { NextFunction, Request, Response } from 'express';
import { createActivitySchema, listActivitiesQuerySchema } from '../schemas/activity.schema';
import * as activityService from '../services/activity.service';
import { recordAudit } from '../utils/audit';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listActivitiesQuerySchema.parse(req.query);
    res.json(await activityService.listActivities(req.organizationId!, query));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createActivitySchema.parse(req.body);
    const activity = await activityService.createActivity(req.organizationId!, req.user!.id, input);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'activity.created',
      resourceType: 'activity',
      resourceId: activity.id,
      metadata: { type: activity.type },
      ipAddress: req.ip,
    });
    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await activityService.deleteActivity(req.organizationId!, req.params.id);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'activity.deleted',
      resourceType: 'activity',
      resourceId: req.params.id,
      ipAddress: req.ip,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
