import { env } from '../config/env';
import { LocalStorageProvider } from './LocalStorageProvider';
import { S3StorageProvider } from './S3StorageProvider';
import type { StorageProvider } from './StorageProvider';

let instance: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (instance) return instance;
  instance = env.STORAGE_PROVIDER === 's3' ? new S3StorageProvider() : new LocalStorageProvider();
  return instance;
}

export type { StorageProvider };
