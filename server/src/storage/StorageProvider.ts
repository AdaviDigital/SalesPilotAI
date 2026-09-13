export interface UploadResult {
  key: string;
  url: string;
}

export interface StorageProvider {
  /** Upload a buffer, return the storage key and a URL to retrieve it. */
  upload(params: {
    key: string;
    buffer: Buffer;
    contentType: string;
  }): Promise<UploadResult>;

  /** Get a URL the client can use to fetch the file (signed if applicable). */
  getUrl(key: string): Promise<string>;

  /** Permanently remove a file. */
  delete(key: string): Promise<void>;
}
