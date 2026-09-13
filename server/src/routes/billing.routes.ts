import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { PLAN_LIMITS } from '../billing/planLimits';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth';
import { AppError } from '../utils/AppError';
import { recordAudit } from '../utils/audit';

const changePlanSchema = z.object({ plan: z.enum(['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE']) });

async function getSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { organizationId: req.organizationId! }, include: { invoices: { orderBy: { issuedAt: 'desc' }, take: 10 } } });
    if (!subscription) throw new AppError('No subscription found for this organization', 404);
    res.json({ ...subscription, limits: PLAN_LIMITS[subscription.plan] });
  } catch (err) {
    next(err);
  }
}

/**
 * Manually changes the stored plan tier. This updates entitlements
 * immediately; it does NOT charge a card. Real self-serve upgrades should
 * go through getBillingProvider().createCheckoutSession() once a processor
 * is configured, with this endpoint reserved for admin/owner overrides and
 * webhook-driven updates.
 */
async function changePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const { plan } = changePlanSchema.parse(req.body);
    const limits = PLAN_LIMITS[plan];
    const subscription = await prisma.subscription.update({
      where: { organizationId: req.organizationId! },
      data: { plan, seatLimit: limits.seatLimit, aiRequestLimit: limits.aiRequestLimit, status: 'active' },
    });
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'billing.plan_changed', metadata: { plan }, ipAddress: req.ip });
    res.json(subscription);
  } catch (err) {
    next(err);
  }
}

async function usage(req: Request, res: Response, next: NextFunction) {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const [subscription, aiRequestCount, aiCostAgg, seatCount] = await Promise.all([
      prisma.subscription.findUnique({ where: { organizationId: req.organizationId! } }),
      prisma.aIUsage.count({ where: { organizationId: req.organizationId!, createdAt: { gte: startOfMonth } } }),
      prisma.aIUsage.aggregate({ where: { organizationId: req.organizationId!, createdAt: { gte: startOfMonth } }, _sum: { estimatedCostUsd: true } }),
      prisma.organizationMember.count({ where: { organizationId: req.organizationId!, status: 'active' } }),
    ]);
    res.json({
      aiRequestsThisMonth: aiRequestCount,
      aiRequestLimit: subscription?.aiRequestLimit ?? 0,
      estimatedAiCostUsd: Number(aiCostAgg._sum.estimatedCostUsd ?? 0),
      seatsUsed: seatCount,
      seatLimit: subscription?.seatLimit ?? 0,
    });
  } catch (err) {
    next(err);
  }
}

async function plans(_req: Request, res: Response) {
  res.json(PLAN_LIMITS);
}

const router = Router();
router.use(requireAuth, requireOrganization);
router.get('/plans', plans);
router.get('/subscription', getSubscription);
router.get('/usage', usage);
router.post('/change-plan', requireRole('OWNER', 'ADMIN'), changePlan);

export default router;
