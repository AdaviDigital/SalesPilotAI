import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  createCustomFieldSchema,
  setCustomFieldValueSchema,
} from '../schemas/customField.schema';
import { prisma } from '../config/prisma';
import {
  requireAuth,
  requireOrganization,
  requireRole,
} from '../middleware/auth';
import { AppError } from '../utils/AppError';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const entity = req.query.entity as string | undefined;

    const fields = await prisma.customField.findMany({
      where: {
        organizationId: req.organizationId!,
        ...(entity
          ? {
              entity:
                entity as Prisma.CustomFieldWhereInput['entity'],
            }
          : {}),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(fields);
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCustomFieldSchema.parse(req.body);

    const field = await prisma.customField.create({
      data: {
        ...input,
        organizationId: req.organizationId!,
      },
    });

    res.status(201).json(field);
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const existing = await prisma.customField.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.organizationId!,
      },
    });

    if (!existing) {
      throw new AppError('Custom field not found', 404);
    }

    await prisma.customField.delete({
      where: {
        id: req.params.id,
      },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * Upserts a value for one record.
 * Uniqueness is (customFieldId, recordId) enforced at the app level here.
 */
async function setValue(req: Request, res: Response, next: NextFunction) {
  try {
    const input = setCustomFieldValueSchema.parse(req.body);

    const field = await prisma.customField.findFirst({
      where: {
        id: input.customFieldId,
        organizationId: req.organizationId!,
      },
    });

    if (!field) {
      throw new AppError('Custom field not found', 404);
    }

    const recordFilter = {
      leadId: input.leadId,
      contactId: input.contactId,
      companyId: input.companyId,
      dealId: input.dealId,
    };

    const existing = await prisma.customFieldValue.findFirst({
      where: {
        customFieldId: input.customFieldId,
        ...recordFilter,
      },
    });

    const value = existing
      ? await prisma.customFieldValue.update({
          where: {
            id: existing.id,
          },
          data: {
            value: input.value,
          },
        })
      : await prisma.customFieldValue.create({
          data: {
            customFieldId: input.customFieldId,
            ...recordFilter,
            value: input.value,
          },
        });

    res.json(value);
  } catch (err) {
    next(err);
  }
}

async function valuesFor(req: Request, res: Response, next: NextFunction) {
  try {
    const querySchema = z.object({
      leadId: z.string().uuid().optional(),
      contactId: z.string().uuid().optional(),
      companyId: z.string().uuid().optional(),
      dealId: z.string().uuid().optional(),
    });

    const q = querySchema.parse(req.query);

    const values = await prisma.customFieldValue.findMany({
      where: {
        customField: {
          organizationId: req.organizationId!,
        },
        ...q,
      },
      include: {
        customField: true,
      },
    });

    res.json(values);
  } catch (err) {
    next(err);
  }
}

const router = Router();

router.use(requireAuth, requireOrganization);

router.get('/', list);
router.post('/', requireRole('OWNER', 'ADMIN'), create);
router.delete('/:id', requireRole('OWNER', 'ADMIN'), remove);
router.get('/values', valuesFor);
router.put('/values', setValue);

export default router;