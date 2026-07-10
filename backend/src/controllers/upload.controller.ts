import type { Request, Response } from 'express';
import { sendSuccess } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/constants';

/**
 * Returns the public URL for an uploaded file.
 * Files are served statically from `/uploads` (see app.ts). When switching to
 * S3 later, only this URL construction + the multer storage engine change.
 */
export const uploadController = {
  single(req: Request, res: Response) {
    if (!req.file) throw ApiError.badRequest('No file provided. Use form field "file".');

    const relativePath = `/uploads/${req.file.filename}`;
    const url = `${req.protocol}://${req.get('host')}${relativePath}`;

    return sendSuccess(
      res,
      {
        url,
        path: relativePath,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
      'File uploaded',
      HttpStatus.CREATED,
    );
  },
};
