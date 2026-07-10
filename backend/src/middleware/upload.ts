import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { env } from '@/config/env';
import { ApiError } from '@/utils/ApiError';

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

/**
 * Local disk storage. When STORAGE_DRIVER=s3, swap this factory for an
 * S3/multer-s3 storage engine — controllers won't need to change because they
 * only read `req.file.path` / `req.file.filename`.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
  },
});

const allowed = /jpeg|jpg|png|webp|gif|pdf|mp4|webm|mov/;

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const okExt = allowed.test(path.extname(file.originalname).toLowerCase());
    const okMime = /image\/|application\/pdf|video\//.test(file.mimetype);
    if (okExt && okMime) return cb(null, true);
    cb(ApiError.badRequest('Unsupported file type. Allowed: images, PDF, video.'));
  },
});
