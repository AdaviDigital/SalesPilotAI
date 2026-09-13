import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { createNoteSchema, listNotesQuerySchema } from '../schemas/note.schema';
import * as noteService from '../services/note.service';
import { requireAuth, requireOrganization } from '../middleware/auth';
import { recordAudit } from '../utils/audit';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = listNotesQuerySchema.parse(req.query);
    res.json(await noteService.listNotes(req.organizationId!, query));
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createNoteSchema.parse(req.body);
    const note = await noteService.createNote(req.organizationId!, req.user!.id, input);
    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'note.created',
      resourceType: 'note',
      resourceId: note.id,
      ipAddress: req.ip,
    });
    res.status(201).json(note);
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await noteService.deleteNote(req.organizationId!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth, requireOrganization);
router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);

export default router;
