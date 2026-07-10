import type { Response } from 'express';
import { z } from 'zod';
import { paymentService } from '@/services/payment.service';
import { sendSuccess } from '@/utils/ApiResponse';
import { ApiError } from '@/utils/ApiError';
import { HttpStatus } from '@/constants';
import type { AuthenticatedRequest } from '@/interfaces';

const orderSchema = z.object({ courseId: z.string().min(1) });
const verifySchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export const paymentController = {
  async createOrder(req: AuthenticatedRequest, res: Response) {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) throw ApiError.badRequest('courseId is required');
    const data = await paymentService.createOrder(req.user!.userId, parsed.data.courseId);
    return sendSuccess(res, data, data.free ? 'Enrolled (free course)' : 'Order created', HttpStatus.CREATED);
  },

  async verify(req: AuthenticatedRequest, res: Response) {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(HttpStatus.UNPROCESSABLE, 'Validation failed', parsed.error.flatten().fieldErrors);
    }
    const data = await paymentService.verifyAndEnroll(req.user!.userId, parsed.data);
    return sendSuccess(res, data, 'Payment verified. You are enrolled!');
  },

  async myPayments(req: AuthenticatedRequest, res: Response) {
    const data = await paymentService.listMine(req.user!.userId);
    return sendSuccess(res, data, 'Payments');
  },
};
