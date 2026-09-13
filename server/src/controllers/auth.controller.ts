import type { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { loginSchema, registerSchema, requestPasswordResetSchema, resetPasswordSchema } from '../schemas/auth.schema';
import * as authService from '../services/auth.service';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { recordAudit } from '../utils/audit';
import { env } from '../config/env';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.register(input);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    if (result.defaultOrganizationId) {
      await recordAudit({
        organizationId: result.defaultOrganizationId,
        userId: result.user.id,
        action: 'user.registered',
        ipAddress: req.ip,
      });
    }
    res.status(201).json({
      accessToken: result.accessToken,
      user: result.user,
      defaultOrganizationId: result.defaultOrganizationId,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    if (result.defaultOrganizationId) {
      await recordAudit({
        organizationId: result.defaultOrganizationId,
        userId: result.user.id,
        action: 'user.login',
        ipAddress: req.ip,
      });
    }
    res.json({
      accessToken: result.accessToken,
      user: result.user,
      defaultOrganizationId: result.defaultOrganizationId,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie('refreshToken');
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  res.json({ user: req.user });
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const token = z.string().min(1).parse(req.query.token);
    await authService.verifyEmail(token);
    res.json({ verified: true });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.resendVerification(req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = requestPasswordResetSchema.parse(req.body);
    await authService.requestPasswordReset(email);
    // Same response regardless of whether the account exists, to avoid user enumeration.
    res.json({ message: 'If an account exists for that email, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, password);
    res.json({ reset: true });
  } catch (err) {
    next(err);
  }
}

const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('User not found', 404);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 401);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    if (req.organizationId) {
      await recordAudit({ organizationId: req.organizationId, userId: user.id, action: 'user.password_changed', ipAddress: req.ip });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

const acceptInviteSchema = z.object({
  token: z.string().min(1),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  password: z.string().min(8),
});

export async function acceptInvite(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, ...input } = acceptInviteSchema.parse(req.body);
    const result = await authService.acceptInvite(token, input);
    res.cookie('refreshToken', result.refreshToken, cookieOptions);
    res.json({ accessToken: result.accessToken, user: result.user, defaultOrganizationId: result.defaultOrganizationId });
  } catch (err) {
    next(err);
  }
}
