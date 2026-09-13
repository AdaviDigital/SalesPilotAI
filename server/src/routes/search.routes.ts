import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { globalSearch } from '../services/search.service';
import { requireAuth, requireOrganization } from '../middleware/auth';

async function search(req: Request, res: Response, next: NextFunction) {
  try {
    const q = z.string().max(200).parse(req.query.q ?? '');
    res.json({ results: await globalSearch(req.organizationId!, q) });
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth, requireOrganization);
router.get('/', search);

export default router;
