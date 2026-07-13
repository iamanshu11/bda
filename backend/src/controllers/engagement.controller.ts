import type { Response } from 'express';
import { z } from 'zod';
import { reviewService } from '@/services/review.service';
import { wishlistService } from '@/services/wishlist.service';
import { sendSuccess } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/constants';
import type { AuthenticatedRequest } from '@/interfaces';

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
});

export const engagementController = {
  // ---- Wishlist ----
  async listWishlist(req: AuthenticatedRequest, res: Response) {
    const data = await wishlistService.list(req.user!.userId);
    return sendSuccess(res, data, 'Wishlist');
  },
  async addWishlist(req: AuthenticatedRequest, res: Response) {
    const courseId = z.string().min(1).safeParse(req.body?.courseId);
    if (!courseId.success) throw ApiError.badRequest('courseId is required');
    const data = await wishlistService.add(req.user!.userId, courseId.data);
    return sendSuccess(res, data, 'Added to wishlist', HttpStatus.CREATED);
  },
  async removeWishlist(req: AuthenticatedRequest, res: Response) {
    const data = await wishlistService.remove(req.user!.userId, req.params.courseId);
    return sendSuccess(res, data, 'Removed from wishlist');
  },

  // ---- Reviews (student) ----
  async reviewEligibility(req: AuthenticatedRequest, res: Response) {
    const data = await reviewService.eligibility(req.user!.userId, req.params.courseId);
    return sendSuccess(res, data, 'Review eligibility');
  },
  async submitReview(req: AuthenticatedRequest, res: Response) {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', parsed.error.flatten().fieldErrors);
    }
    const data = await reviewService.submit(req.user!.userId, req.params.courseId, parsed.data);
    return sendSuccess(res, data, 'Review submitted — it will appear after approval.', HttpStatus.CREATED);
  },
};
