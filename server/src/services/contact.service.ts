import * as contactRepo from '../repositories/contact.repository';
import { AppError } from '../utils/AppError';
import type { CreateContactInput, ListContactsQuery, UpdateContactInput } from '../schemas/contact.schema';

export async function listContacts(organizationId: string, query: ListContactsQuery) {
  return contactRepo.list(organizationId, query);
}

export async function getContact(organizationId: string, id: string) {
  const contact = await contactRepo.findById(organizationId, id);
  if (!contact) throw new AppError('Contact not found', 404);
  return contact;
}

export async function createContact(organizationId: string, input: CreateContactInput) {
  return contactRepo.create(organizationId, input);
}

export async function updateContact(organizationId: string, id: string, input: UpdateContactInput) {
  const updated = await contactRepo.update(organizationId, id, input);
  if (!updated) throw new AppError('Contact not found', 404);
  return updated;
}

export async function deleteContact(organizationId: string, id: string) {
  const deleted = await contactRepo.softDelete(organizationId, id);
  if (!deleted) throw new AppError('Contact not found', 404);
  return deleted;
}
