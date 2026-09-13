import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import * as analyticsService from '../services/analytics.service';
import { requireAuth, requireOrganization } from '../middleware/auth';

async function leads(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await analyticsService.getLeadAnalytics(req.organizationId!));
  } catch (err) {
    next(err);
  }
}
async function sales(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await analyticsService.getSalesAnalytics(req.organizationId!));
  } catch (err) {
    next(err);
  }
}
async function team(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await analyticsService.getTeamAnalytics(req.organizationId!));
  } catch (err) {
    next(err);
  }
}
async function funnel(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await analyticsService.getPipelineFunnel(req.organizationId!));
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth, requireOrganization);
router.get('/leads', leads);
router.get('/sales', sales);
router.get('/team', team);
router.get('/funnel', funnel);

export default router;
