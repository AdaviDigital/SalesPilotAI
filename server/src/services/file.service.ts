import { randomUUID } from 'crypto';
import { prisma } from '../config/prisma';
import { getStorageProvider } from '../storage';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import type { RelatedType } from '../schemas/file.constants';

function buildKey(organizationId: string, fileName: string) {
  const ext = fileName.includes('.') ? fileName.split('.').pop() : undefined;
  const safeName = `${randomUUID()}${ext ? `.${ext}` : ''}`;
  return `${organizationId}/${safeName}`;
}

export async function uploadFile(params: {
  organizationId: string;
  uploadedById: string;
  file: Express.Multer.File;
  relatedType?: RelatedType;
  relatedId?: string;
}) {
  const storage = getStorageProvider();
  const key = buildKey(params.organizationId, params.file.originalname);

  const { url } = await storage.upload({ key, buffer: params.file.buffer, contentType: params.file.mimetype });

  return prisma.file.create({
    data: {
      organizationId: params.organizationId,
      fileName: params.file.originalname,
      mimeType: params.file.mimetype,
      sizeBytes: params.file.size,
      storageKey: key,
      storageProvider: env.STORAGE_PROVIDER,
      uploadedById: params.uploadedById,
      relatedType: params.relatedType,
      relatedId: params.relatedId,
    },
  }).then((record) => ({ ...record, url }));
}

export async function listFiles(organizationId: string, relatedType?: RelatedType, relatedId?: string) {
  const files = await prisma.file.findMany({
    where: { organizationId, ...(relatedType ? { relatedType } : {}), ...(relatedId ? { relatedId } : {}) },
    orderBy: { createdAt: 'desc' },
  });
  const storage = getStorageProvider();
  return Promise.all(files.map(async (f) => ({ ...f, url: await storage.getUrl(f.storageKey) })));
}

export async function deleteFile(organizationId: string, id: string) {
  const file = await prisma.file.findFirst({ where: { id, organizationId } });
  if (!file) throw new AppError('File not found', 404);
  const storage = getStorageProvider();
  await storage.delete(file.storageKey);
  await prisma.file.delete({ where: { id } });
}

export async function getFileUrl(organizationId: string, id: string) {
  const file = await prisma.file.findFirst({ where: { id, organizationId } });
  if (!file) throw new AppError('File not found', 404);
  const storage = getStorageProvider();
  return { file, url: await storage.getUrl(file.storageKey) };
}
