import * as noteRepo from '../repositories/note.repository';
import { AppError } from '../utils/AppError';
import type { CreateNoteInput, ListNotesQuery } from '../schemas/note.schema';

export async function listNotes(organizationId: string, query: ListNotesQuery) {
  return noteRepo.list(organizationId, query);
}

export async function createNote(organizationId: string, userId: string, input: CreateNoteInput) {
  return noteRepo.create(organizationId, userId, input);
}

export async function deleteNote(organizationId: string, id: string) {
  const deleted = await noteRepo.remove(organizationId, id);
  if (!deleted) throw new AppError('Note not found', 404);
  return deleted;
}
