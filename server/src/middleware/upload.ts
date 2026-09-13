import multer from 'multer';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '../schemas/file.constants';
import { AppError } from '../utils/AppError';

// Memory storage, not disk storage: the buffer is handed to whichever
// StorageProvider is configured (local filesystem in dev, S3-compatible in
// production). This keeps the upload path portable — no code here assumes
// a writable local disk exists in production, which several hosts (and any
// future container-based deploy) may not guarantee.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new AppError(`File type not allowed: ${file.mimetype}`, 415));
      return;
    }
    cb(null, true);
  },
});
