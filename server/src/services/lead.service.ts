import * as leadRepo from '../repositories/lead.repository';
import { AppError } from '../utils/AppError';
import { evaluateLeadStatusChange } from './automation.service';
import type { CreateLeadInput, ListLeadsQuery, UpdateLeadInput } from '../schemas/lead.schema';

export async function listLeads(organizationId: string, query: ListLeadsQuery) {
  return leadRepo.list(organizationId, query);
}

export async function getLead(organizationId: string, id: string) {
  const lead = await leadRepo.findById(organizationId, id);
  if (!lead) throw new AppError('Lead not found', 404);
  return lead;
}

export async function createLead(organizationId: string, input: CreateLeadInput) {
  if (input.email) {
    const duplicate = await leadRepo.findDuplicateByEmail(organizationId, input.email);
    if (duplicate) {
      throw new AppError(`A lead with email ${input.email} already exists (duplicate detection)`, 409);
    }
  }
  return leadRepo.create(organizationId, input);
}

export async function updateLead(organizationId: string, id: string, input: UpdateLeadInput) {
  const updated = await leadRepo.update(organizationId, id, input);
  if (!updated) throw new AppError('Lead not found', 404);

  if (input.status) {
    // Fire-and-forget is deliberately avoided here — automation side
    // effects (tasks, notifications) should be visible to the caller if
    // they fail, so this is awaited rather than detached.
    await evaluateLeadStatusChange(organizationId, id, input.status, updated.ownerId);
  }

  return updated;
}

export async function deleteLead(organizationId: string, id: string) {
  const deleted = await leadRepo.softDelete(organizationId, id);
  if (!deleted) throw new AppError('Lead not found', 404);
  return deleted;
}

export async function getDuplicateGroups(organizationId: string) {
  return leadRepo.findDuplicateGroups(organizationId);
}

export async function mergeLeads(organizationId: string, keepId: string, mergeIds: string[]) {
  const merged = await leadRepo.mergeLeads(organizationId, keepId, mergeIds);
  if (!merged) throw new AppError('Could not merge — check that the lead ids are valid', 400);
  return merged;
}
