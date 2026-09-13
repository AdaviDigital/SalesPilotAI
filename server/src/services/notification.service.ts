import { prisma } from '../config/prisma';

export async function createNotification(
  organizationId: string,
  userId: string,
  input: { type: string; title: string; body?: string; link?: string },
) {
  return prisma.notification.create({ data: { organizationId, userId, ...input } });
}

export async function listNotifications(organizationId: string, userId: string, unreadOnly: boolean) {
  return prisma.notification.findMany({
    where: { organizationId, userId, ...(unreadOnly ? { isRead: false } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function markRead(organizationId: string, userId: string, id: string) {
  const existing = await prisma.notification.findFirst({ where: { id, organizationId, userId } });
  if (!existing) return null;
  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllRead(organizationId: string, userId: string) {
  return prisma.notification.updateMany({ where: { organizationId, userId, isRead: false }, data: { isRead: true } });
}

export async function unreadCount(organizationId: string, userId: string) {
  return prisma.notification.count({ where: { organizationId, userId, isRead: false } });
}
