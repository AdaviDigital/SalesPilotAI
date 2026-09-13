import * as dealRepo from '../repositories/deal.repository';
import { AppError } from '../utils/AppError';
import type { CreateDealInput, ListDealsQuery, UpdateDealInput } from '../schemas/deal.schema';

export async function listDeals(organizationId: string, query: ListDealsQuery) {
  return dealRepo.list(organizationId, query);
}

export async function getDeal(organizationId: string, id: string) {
  const deal = await dealRepo.findById(organizationId, id);
  if (!deal) throw new AppError('Deal not found', 404);
  return deal;
}

export async function createDeal(organizationId: string, input: CreateDealInput) {
  return dealRepo.create(organizationId, input);
}

export async function updateDeal(organizationId: string, id: string, input: UpdateDealInput) {
  const updated = await dealRepo.update(organizationId, id, input);
  if (!updated) throw new AppError('Deal not found', 404);
  return updated;
}

export async function moveDealStage(organizationId: string, id: string, stageId: string) {
  const updated = await dealRepo.moveStage(organizationId, id, stageId);
  if (!updated) throw new AppError('Deal or stage not found', 404);
  return updated;
}

export async function deleteDeal(organizationId: string, id: string) {
  const deleted = await dealRepo.softDelete(organizationId, id);
  if (!deleted) throw new AppError('Deal not found', 404);
  return deleted;
}
