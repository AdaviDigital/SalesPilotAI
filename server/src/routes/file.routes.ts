import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { upload } from '../middleware/upload';
import * as fileService from '../services/file.service';
import {
  requireAuth,
  requireOrganization,
} from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { recordAudit } from '../utils/audit';
import { RELATED_TYPES } from '../schemas/file.constants';

const uploadMetaSchema = z.object({
  relatedType: z.enum(RELATED_TYPES).optional(),
  relatedId: z.string().uuid().optional(),
});

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new AppError('No file provided', 400);
    }

    const meta = uploadMetaSchema.parse(req.body);

    const file = await fileService.uploadFile({
      organizationId: req.organizationId!,
      uploadedById: req.user!.id,
      file: req.file,
      ...meta,
    });

    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'file.uploaded',
      resourceType: 'file',
      resourceId: file.id,
      metadata: {
        fileName: file.fileName,
        relatedType: meta.relatedType,
        relatedId: meta.relatedId,
      },
      ipAddress: req.ip,
    });

    res.status(201).json(file);
  } catch (err) {
    next(err);
  }
}

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const querySchema = z.object({
      relatedType: z.enum(RELATED_TYPES).optional(),
      relatedId: z.string().uuid().optional(),
    });

    const query = querySchema.parse(req.query);

    res.json(
      await fileService.listFiles(
        req.organizationId!,
        query.relatedType,
        query.relatedId,
      ),
    );
  } catch (err) {
    next(err);
  }
}

async function getUrl(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await fileService.getFileUrl(
        req.organizationId!,
        req.params.id,
      ),
    );
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await fileService.deleteFile(
      req.organizationId!,
      req.params.id,
    );

    await recordAudit({
      organizationId: req.organizationId!,
      userId: req.user!.id,
      action: 'file.deleted',
      resourceType: 'file',
      resourceId: req.params.id,
      ipAddress: req.ip,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', list);
router.post('/', upload.single('file'), create);
router.get('/:id', getUrl);
router.delete('/:id', remove);

export default router;