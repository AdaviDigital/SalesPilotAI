import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';

export async function enforceAIUsageLimit(req: Request, _res: Response, next: NextFunction) {
  try {
    const subscription = await prisma.subscription.findUnique({ where: { organizationId: req.organizationId! } });
    if (!subscription) return next(); // no subscription row (shouldn't happen post-registration) — fail open rather than block the CRM

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const count = await prisma.aIUsage.count({ where: { organizationId: req.organizationId!, createdAt: { gte: startOfMonth } } });

    if (count >= subscription.aiRequestLimit) {
      throw new AppError(
        `Monthly AI request limit reached (${subscription.aiRequestLimit} for the ${subscription.plan} plan). Upgrade your plan in Settings → Billing to continue.`,
        429,
      );
    }
    next();
  } catch (err) {
    next(err);
  }
}
