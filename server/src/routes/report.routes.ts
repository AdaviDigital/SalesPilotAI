import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { createReportSchema, reportConfigSchema } from '../schemas/report.schema';
import * as reportService from '../services/report.service';
import { requireAuth, requireOrganization } from '../middleware/auth';
import { AppError } from '../utils/AppError';

async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await reportService.listReports(req.organizationId!));
  } catch (err) {
    next(err);
  }
}

async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createReportSchema.parse(req.body);
    res.status(201).json(await reportService.createReport(req.organizationId!, input.name, input.config));
  } catch (err) {
    next(err);
  }
}

/** Run a report config ad-hoc without saving it (used by the report builder UI preview). */
async function preview(req: Request, res: Response, next: NextFunction) {
  try {
    const config = reportConfigSchema.parse(req.body);
    res.json(await reportService.runReport(req.organizationId!, config));
  } catch (err) {
    next(err);
  }
}

async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await reportService.deleteReport(req.organizationId!, req.params.id);
    if (!deleted) throw new AppError('Report not found', 404);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth, requireOrganization);
router.get('/', list);
router.post('/', create);
router.post('/preview', preview);
router.delete('/:id', remove);

export default router;
