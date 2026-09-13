import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import type { StorageProvider, UploadResult } from './StorageProvider';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export class LocalStorageProvider implements StorageProvider {
  private async ensureDir(filePath: string) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
  }

  async upload({ key, buffer }: { key: string; buffer: Buffer; contentType: string }): Promise<UploadResult> {
    const filePath = path.join(UPLOAD_DIR, key);
    await this.ensureDir(filePath);
    await fs.writeFile(filePath, buffer);
    return { key, url: await this.getUrl(key) };
  }

  async getUrl(key: string): Promise<string> {
    // Served by the /files/local/:key static route. Local storage is intended
    // for development only — production should use STORAGE_PROVIDER=s3.
    return `${env.API_URL}/files/local/${encodeURIComponent(key)}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOAD_DIR, key);
    await fs.rm(filePath, { force: true });
  }
}
