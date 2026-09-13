import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { updateOrganizationSchema, updateOrganizationSettingsSchema } from '../schemas/settings.schema';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { requireAuth, requireOrganization, requireRole } from '../middleware/auth';
import { recordAudit } from '../utils/audit';
import { AppError } from '../utils/AppError';
import { sendEmail, newUserInviteEmailHtml, existingUserInviteEmailHtml } from '../services/email.service';

async function getOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.organizationId! },
      include: { settings: true, subscription: true },
    });
    res.json(org);
  } catch (err) {
    next(err);
  }
}

async function updateOrganization(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateOrganizationSchema.parse(req.body);
    const org = await prisma.organization.update({ where: { id: req.organizationId! }, data: input });
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'organization.updated', ipAddress: req.ip });
    res.json(org);
  } catch (err) {
    next(err);
  }
}

async function updateAISettings(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateOrganizationSettingsSchema.parse(req.body);
    const settings = await prisma.organizationSettings.update({ where: { organizationId: req.organizationId! }, data: input });
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'organization.ai_settings_updated', metadata: input, ipAddress: req.ip });
    res.json(settings);
  } catch (err) {
    next(err);
  }
}

async function listMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const members = await prisma.organizationMember.findMany({
      where: { organizationId: req.organizationId! },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    res.json(members);
  } catch (err) {
    next(err);
  }
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'SALES_MANAGER', 'SALES_REP', 'MARKETING', 'VIEWER']),
});

/**
 * Invites a member. Two real paths, not a stub:
 *  - Existing user: added as an active member immediately (they already
 *    have working credentials) and notified by email.
 *  - Brand-new email: a User row is created with an unusable random
 *    password hash and a time-limited accept-invite token (see
 *    auth.service.acceptInvite), membership starts as 'invited', and an
 *    email is sent with a link to set their real password and activate.
 */
async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, role } = inviteSchema.parse(req.body);
    const organization = await prisma.organization.findUnique({ where: { id: req.organizationId! } });
    if (!organization) throw new AppError('Organization not found', 404);

    let user = await prisma.user.findUnique({ where: { email } });

    const existingMembership = user
      ? await prisma.organizationMember.findUnique({ where: { organizationId_userId: { organizationId: req.organizationId!, userId: user.id } } })
      : null;
    if (existingMembership) throw new AppError('This person is already a member of this organization', 409);

    if (user) {
      await prisma.organizationMember.create({
        data: { organizationId: req.organizationId!, userId: user.id, role, status: 'active', joinedAt: new Date() },
      });
      await sendEmail({
        to: user.email,
        subject: `You've been added to ${organization.name} on SalesPilot AI`,
        html: existingUserInviteEmailHtml(user.firstName, organization.name, role),
      });
    } else {
      const unusableHash = await bcrypt.hash(randomBytes(24).toString('hex'), 12);
      const token = randomBytes(32).toString('hex');
      user = await prisma.user.create({
        data: {
          email,
          firstName: email.split('@')[0],
          lastName: '',
          passwordHash: unusableHash,
          isEmailVerified: false,
          passwordResetToken: token,
          passwordResetExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await prisma.organizationMember.create({
        data: { organizationId: req.organizationId!, userId: user.id, role, status: 'invited' },
      });
      await sendEmail({
        to: email,
        subject: `You're invited to join ${organization.name} on SalesPilot AI`,
        html: newUserInviteEmailHtml(organization.name, role, `${env.APP_URL}/accept-invite?token=${token}`),
      });
    }

    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'member.invited', metadata: { email, role }, ipAddress: req.ip });
    res.status(201).json({ invited: true, email, role });
  } catch (err) {
    next(err);
  }
}

const roleUpdateSchema = z.object({ role: z.enum(['OWNER', 'ADMIN', 'SALES_MANAGER', 'SALES_REP', 'MARKETING', 'VIEWER']) });

async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = roleUpdateSchema.parse(req.body);
    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: req.organizationId!, userId: req.params.userId } },
    });
    if (!membership) throw new AppError('Member not found', 404);

    if (membership.role === 'OWNER' && role !== 'OWNER') {
      const ownerCount = await prisma.organizationMember.count({ where: { organizationId: req.organizationId!, role: 'OWNER', status: 'active' } });
      if (ownerCount <= 1) throw new AppError('Cannot change the role of the last remaining owner', 400);
    }

    const updated = await prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId: req.organizationId!, userId: req.params.userId } },
      data: { role },
    });
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'member.role_changed', resourceId: req.params.userId, metadata: { role }, ipAddress: req.ip });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: req.organizationId!, userId: req.params.userId } },
    });
    if (!membership) throw new AppError('Member not found', 404);

    if (membership.role === 'OWNER') {
      const ownerCount = await prisma.organizationMember.count({ where: { organizationId: req.organizationId!, role: 'OWNER', status: 'active' } });
      if (ownerCount <= 1) throw new AppError('Cannot remove the last remaining owner', 400);
    }

    await prisma.organizationMember.delete({ where: { organizationId_userId: { organizationId: req.organizationId!, userId: req.params.userId } } });
    await recordAudit({ organizationId: req.organizationId!, userId: req.user!.id, action: 'member.removed', resourceId: req.params.userId, ipAddress: req.ip });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const router = Router();
router.use(requireAuth, requireOrganization);

router.get('/current', getOrganization);
router.patch('/current', requireRole('OWNER', 'ADMIN'), updateOrganization);
router.patch('/current/ai-settings', requireRole('OWNER', 'ADMIN'), updateAISettings);
router.get('/current/members', listMembers);
router.post('/current/members/invite', requireRole('OWNER', 'ADMIN'), inviteMember);
router.patch('/current/members/:userId', requireRole('OWNER', 'ADMIN'), updateMemberRole);
router.delete('/current/members/:userId', requireRole('OWNER', 'ADMIN'), removeMember);

export default router;
