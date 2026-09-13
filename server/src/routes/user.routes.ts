import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { updateProfileSchema } from '../schemas/settings.schema';
import { prisma } from '../config/prisma';
import { requireAuth } from '../middleware/auth';

async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true, isEmailVerified: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: input,
      select: { id: true, email: true, firstName: true, lastName: true, avatarUrl: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function myOrganizations(req: Request, res: Response, next: NextFunction) {
  try {
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: req.user!.id, status: 'active' },
      include: { organization: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    });
    res.json(memberships.map((m) => ({ ...m.organization, role: m.role })));
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth);

router.get('/me', getProfile);
router.patch('/me', updateProfile);
router.get('/me/organizations', myOrganizations);

export default router;
