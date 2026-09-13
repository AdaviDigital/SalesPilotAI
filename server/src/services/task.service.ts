import * as taskRepo from '../repositories/task.repository';
import { AppError } from '../utils/AppError';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../schemas/task.schema';

export async function listTasks(organizationId: string, userId: string, query: ListTasksQuery) {
  return taskRepo.list(organizationId, userId, query);
}

export async function getTask(organizationId: string, id: string) {
  const task = await taskRepo.findById(organizationId, id);
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function createTask(organizationId: string, input: CreateTaskInput) {
  return taskRepo.create(organizationId, input);
}

export async function updateTask(organizationId: string, id: string, input: UpdateTaskInput) {
  const updated = await taskRepo.update(organizationId, id, input);
  if (!updated) throw new AppError('Task not found', 404);
  return updated;
}

export async function deleteTask(organizationId: string, id: string) {
  const deleted = await taskRepo.remove(organizationId, id);
  if (!deleted) throw new AppError('Task not found', 404);
  return deleted;
}
