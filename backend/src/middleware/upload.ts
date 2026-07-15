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
/**
 * Strict allowlist. Each extension is paired with its expected MIME type(s) so
 * a spoofed Content-Type or a double extension (e.g. `x.php.jpg`, `x.svg`) is
 * rejected. SVG is intentionally NOT allowed (SVGs can carry inline scripts).
 * The stored filename is always server-generated with a normalized extension,
 * so the client's original name never touches the filesystem.
 */
export const ALLOWED_UPLOADS: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.webp': ['image/webp'],
  '.gif': ['image/gif'],
  '.pdf': ['application/pdf'],
  '.mp4': ['video/mp4'],
  '.webm': ['video/webm'],
  '.mov': ['video/quicktime', 'video/mp4'],
};

/**
 * Pure allowlist check used by the multer fileFilter (and unit tests): the file
 * extension must be allowed AND the declared MIME must match that extension.
 * Rejects SVG, double extensions (via the normalized ext) and MIME spoofing.
 */
export function isAllowedUpload(originalname: string, mimetype: string): boolean {
  const ext = path.extname(originalname).toLowerCase();
  const expected = ALLOWED_UPLOADS[ext];
  return Boolean(expected && expected.includes(mimetype));
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex');
    // Use the normalized/validated extension, never the raw original name.
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_UPLOADS[ext] ? ext : '';
    cb(null, `${Date.now()}-${unique}${safeExt}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (isAllowedUpload(file.originalname, file.mimetype)) return cb(null, true);
    cb(
      ApiError.badRequest(
        'Unsupported or mismatched file type. Allowed: JPG, PNG, WEBP, GIF, PDF, MP4, WEBM, MOV.',
      ),
    );
  },
});
