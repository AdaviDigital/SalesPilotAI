import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

// Populated onto every authenticated + tenant-scoped request. Every query
// downstream must filter by organizationId taken from THIS object, never
// from a client-supplied field, to guarantee tenant isolation.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      organizationId?: string;
      role?: Role;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.accessToken;
    if (!token) throw new AppError('Unauthorized', 401);

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.deletedAt) throw new AppError('Unauthorized', 401);

    req.user = { id: user.id, email: user.email };
    next();
  } catch {
    next(new AppError('Unauthorized', 401));
  }
}

/**
 * Resolves which organization this request operates on (from an
 * X-Organization-Id header, since a user can belong to multiple orgs) and
 * confirms active membership. Every tenant-scoped route uses this AFTER
 * requireAuth.
 */
export async function requireOrganization(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError('Unauthorized', 401);
    const organizationId = req.header('X-Organization-Id');
    if (!organizationId) throw new AppError('Organization context required', 400);

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: req.user.id } },
    });
    if (!membership || membership.status !== 'active') {
      throw new AppError('Forbidden: not a member of this organization', 403);
    }

    req.organizationId = organizationId;
    req.role = membership.role;
    next();
  } catch (err) {
    next(err);
  }
}

/** Role-based access control gate. Use after requireOrganization. */
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.role || !allowed.includes(req.role)) {
      return next(new AppError('Forbidden: insufficient permissions', 403));
    }
    next();
  };
}
