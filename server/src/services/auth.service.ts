import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'crypto';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { sendEmail, verificationEmailHtml, passwordResetEmailHtml } from './email.service';
import { env } from '../config/env';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `org-${randomUUID().slice(0, 8)}`
  );
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('An account with this email already exists', 409);

  const passwordHash = await bcrypt.hash(input.password, 12);
  const emailVerifyToken = randomBytes(32).toString('hex');
  const baseSlug = slugify(input.organizationName);

  // Ensure slug uniqueness without leaking whether a name collision exists.
  let slug = baseSlug;
  let suffix = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.organization.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        passwordHash,
        emailVerifyToken,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: input.organizationName,
        slug,
        settings: { create: {} },
        subscription: { create: { plan: 'FREE', status: 'trialing' } },
        pipelines: {
          create: {
            name: 'Default Pipeline',
            isDefault: true,
            stages: {
              create: [
                { name: 'New Lead', order: 0, probability: 10 },
                { name: 'Contacted', order: 1, probability: 20 },
                { name: 'Qualified', order: 2, probability: 40 },
                { name: 'Discovery', order: 3, probability: 55 },
                { name: 'Proposal', order: 4, probability: 70 },
                { name: 'Negotiation', order: 5, probability: 85 },
                { name: 'Closed Won', order: 6, probability: 100, isWon: true },
                { name: 'Closed Lost', order: 7, probability: 0, isLost: true },
              ],
            },
          },
        },
      },
    });

    await tx.organizationMember.create({
      data: { organizationId: organization.id, userId: user.id, role: 'OWNER', joinedAt: new Date() },
    });

    return { user, organization };
  });

  await sendEmail({
    to: result.user.email,
    subject: 'Verify your SalesPilot AI account',
    html: verificationEmailHtml(result.user.firstName, `${env.APP_URL}/verify-email?token=${emailVerifyToken}`),
  });

  return issueTokens(result.user.id, result.user.email, result.organization.id);
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || user.deletedAt) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, status: 'active' },
    orderBy: { joinedAt: 'asc' },
  });

  return issueTokens(user.id, user.email, membership?.organizationId ?? null);
}

function issueTokens(userId: string, email: string, defaultOrganizationId: string | null) {
  return {
    accessToken: signAccessToken({ userId }),
    refreshToken: signRefreshToken({ userId }),
    user: { id: userId, email },
    defaultOrganizationId,
  };
}

export async function verifyEmail(token: string) {
  const user = await prisma.user.findFirst({ where: { emailVerifyToken: token } });
  if (!user) throw new AppError('Invalid or expired verification link', 400);
  await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true, emailVerifyToken: null } });
}

export async function resendVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);
  if (user.isEmailVerified) return;
  const token = randomBytes(32).toString('hex');
  await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: token } });
  await sendEmail({
    to: user.email,
    subject: 'Verify your SalesPilot AI account',
    html: verificationEmailHtml(user.firstName, `${env.APP_URL}/verify-email?token=${token}`),
  });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always respond as if successful — don't reveal whether an account exists.
  if (!user) return;
  const token = randomBytes(32).toString('hex');
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) },
  });
  await sendEmail({
    to: user.email,
    subject: 'Reset your SalesPilot AI password',
    html: passwordResetEmailHtml(user.firstName, `${env.APP_URL}/reset-password?token=${token}`),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({ where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } } });
  if (!user) throw new AppError('Invalid or expired reset link', 400);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
  });
}

/**
 * Completes a brand-new invited user's signup. Deliberately reuses the
 * passwordResetToken/passwordResetExpires columns rather than adding a
 * dedicated invite-token column: the mechanics are identical (a
 * time-limited, single-use token that authorizes setting a password), and
 * an invited user with no password yet cannot have a "real" reset pending
 * at the same time. See organization.routes.ts inviteMember for where the
 * token is issued.
 */
export async function acceptInvite(token: string, input: { firstName: string; lastName: string; password: string }) {
  const user = await prisma.user.findFirst({ where: { passwordResetToken: token, passwordResetExpires: { gt: new Date() } } });
  if (!user) throw new AppError('Invalid or expired invitation link', 400);

  const passwordHash = await bcrypt.hash(input.password, 12);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      isEmailVerified: true,
      passwordResetToken: null,
      passwordResetExpires: null,
    },
  });

  // Activate every membership this user was invited to (normally just one,
  // but a user can theoretically be invited to a second org before
  // accepting the first invite).
  const activated = await prisma.organizationMember.updateMany({
    where: { userId: user.id, status: 'invited' },
    data: { status: 'active', joinedAt: new Date() },
  });

  const firstMembership = await prisma.organizationMember.findFirst({
    where: { userId: user.id, status: 'active' },
    orderBy: { joinedAt: 'desc' },
  });

  return { ...issueTokens(updated.id, updated.email, firstMembership?.organizationId ?? null), activatedCount: activated.count };
}
