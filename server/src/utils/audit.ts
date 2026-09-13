import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface AuditLogParams {
  organizationId: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Record an audit log entry.
 */
export async function recordAudit(params: AuditLogParams) {
  const {
    organizationId,
    userId,
    action,
    resourceType,
    resourceId,
    metadata,
    ipAddress,
  } = params;

  const data: Prisma.AuditLogUncheckedCreateInput = {
    organizationId,
    userId,
    action,
    resourceType,
    resourceId,
    metadata: metadata as Prisma.InputJsonValue | undefined,
    ipAddress,
  };

  return prisma.auditLog.create({
    data,
  });
}

/**
 * Alias retained for callers that use the more descriptive name.
 */
export const createAuditLog = recordAudit;