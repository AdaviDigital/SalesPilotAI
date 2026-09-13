import type { NextFunction, Request, Response } from 'express';
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from '../schemas/task.schema';
import * as taskService from '../services/task.service';
import { recordAudit } from '../utils/audit';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listTasksQuerySchema.parse(req.query);
    res.json(await taskService.listTasks(req.organizationId!, req.user!.id, query));
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await taskService.getTask(req.organizationId!, req.params.id));
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createTaskSchema.parse(req.body);
    const task = await taskService.createTask(req.organizationId!, input);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'task.created',
      resourceType: 'task',
      resourceId: task.id,
      ipAddress: req.ip,
    });
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateTaskSchema.parse(req.body);
    const task = await taskService.updateTask(req.organizationId!, req.params.id, input);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'task.updated',
      resourceType: 'task',
      resourceId: task.id,
      metadata: { status: task.status },
      ipAddress: req.ip,
    });
    res.json(task);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await taskService.deleteTask(req.organizationId!, req.params.id);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'task.deleted',
      resourceType: 'task',
      resourceId: req.params.id,
      ipAddress: req.ip,
    });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
