import crypto from 'crypto';
import { prisma } from '@/config/prisma';
import { env } from '@/config/env';
import { getRazorpay, isRazorpayConfigured } from '@/config/razorpay';
import { ApiError } from '@/utils/ApiError';
import { studentService } from '@/services/student.service';

/** Normalize Razorpay SDK errors (plain objects, not Error instances). */
function throwRazorpayError(err: unknown): never {
  const e = err as { statusCode?: number; error?: { description?: string; code?: string }; message?: string };
  const description = e?.error?.description || e?.message || 'Payment gateway error';
  if (e?.statusCode === 401 || /authentication failed/i.test(description)) {
    throw ApiError.internal(
      'Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env — they must be a matching Key Id + Key Secret pair from the same Razorpay mode (Test or Live).',
    );
  }
  throw ApiError.badRequest(`Payment gateway: ${description}`);
}

/**
 * Razorpay course-purchase flow.
 * - createOrder: validates the course, enrolls free courses directly, or
 *   creates a Razorpay order + a pending Payment row for paid courses.
 * - verifyAndEnroll: verifies the payment signature server-side, then enrolls.
 */
export const paymentService = {
  async createOrder(userId: string, courseId: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found.');

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw ApiError.conflict('You are already enrolled in this course.');

    const feesNumber = course.fees ? Number(course.fees) : 0;

    // Free course → enroll immediately, no payment needed.
    if (!feesNumber || feesNumber <= 0) {
      await studentService.enroll(userId, courseId);
      return { free: true as const, enrolled: true };
    }

    if (!isRazorpayConfigured) {
      throw ApiError.internal('Online payments are not configured. Please contact the academy.');
    }

    const amount = Math.round(feesNumber * 100); // paise
    const receipt = `bda_${courseId.slice(0, 8)}_${Date.now()}`.slice(0, 40);

    let order: { id: string };
    try {
      order = await getRazorpay().orders.create({
        amount,
        currency: 'INR',
        receipt,
        notes: { courseId, userId },
      });
    } catch (err) {
      throwRazorpayError(err);
    }

    await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount,
        currency: 'INR',
        status: 'CREATED',
        razorpayOrderId: order.id,
        receipt,
      },
    });

    return {
      free: false as const,
      orderId: order.id,
      amount,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      courseTitle: course.title,
    };
  },

  async verifyAndEnroll(
    userId: string,
    input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: input.razorpayOrderId } });
    if (!payment || payment.userId !== userId) throw ApiError.notFound('Payment not found.');
    if (payment.status === 'PAID') return { enrolled: true, courseId: payment.courseId };

    // Verify signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
      .digest('hex');

    if (expected !== input.razorpaySignature) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      throw ApiError.badRequest('Payment verification failed.');
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
      },
    });

    // Enroll (ignore if somehow already enrolled)
    try {
      await studentService.enroll(userId, payment.courseId);
    } catch {
      /* already enrolled — safe to ignore */
    }

    return { enrolled: true, courseId: payment.courseId };
  },

  /** The user's own payment history. */
  listMine(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { course: { select: { title: true, slug: true } } },
    });
  },
};
