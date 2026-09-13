import * as activityRepo from '../repositories/activity.repository';
import { AppError } from '../utils/AppError';
import type { CreateActivityInput, ListActivitiesQuery } from '../schemas/activity.schema';

export async function listActivities(organizationId: string, query: ListActivitiesQuery) {
  return activityRepo.list(organizationId, query);
}

export async function createActivity(organizationId: string, userId: string, input: CreateActivityInput) {
  return activityRepo.create(organizationId, userId, input);
}

export async function deleteActivity(organizationId: string, id: string) {
  const deleted = await activityRepo.remove(organizationId, id);
  if (!deleted) throw new AppError('Activity not found', 404);
  return deleted;
}
