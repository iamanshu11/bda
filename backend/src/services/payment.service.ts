import crypto from 'crypto';
import { prisma } from '@/config/prisma';
import { env } from '@/config/env';
import { getRazorpay, isRazorpayConfigured } from '@/config/razorpay';
import { ApiError } from '@/utils/ApiError';
import { studentService } from '@/services/student.service';
import { couponService } from '@/services/coupon.service';
import { writtenTestService } from '@/services/writtenTest.service';

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

export const paymentService = {
  async createOrder(userId: string, courseId: string, couponCode?: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found.');

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (existing) throw ApiError.conflict('You are already enrolled in this course.');

    const feesNumber = course.fees ? Number(course.fees) : 0;

    if (!feesNumber || feesNumber <= 0) {
      await studentService.enroll(userId, courseId);
      return { free: true as const, enrolled: true };
    }

    if (!isRazorpayConfigured) {
      throw ApiError.internal('Online payments are not configured. Please contact the academy.');
    }

    let couponId: string | null = null;
    let discountPaise = 0;
    let payableRupees = feesNumber;
    if (couponCode) {
      const evalResult = await couponService.evaluate(userId, couponCode, courseId);
      couponId = evalResult.couponId;
      discountPaise = evalResult.discount * 100;
      payableRupees = evalResult.finalAmount;
    }

    const originalAmount = Math.round(feesNumber * 100);
    const amount = Math.max(100, Math.round(payableRupees * 100));
    const receipt = `bda_${courseId.slice(0, 8)}_${Date.now()}`.slice(0, 40);

    await prisma.payment.updateMany({
      where: { userId, courseId, status: 'CREATED' },
      data: { status: 'FAILED' },
    });

    let order: { id: string };
    try {
      order = await getRazorpay().orders.create({
        amount,
        currency: 'INR',
        receipt,
        notes: { courseId, userId, kind: 'course' },
      });
    } catch (err) {
      throwRazorpayError(err);
    }

    await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount,
        originalAmount,
        discountApplied: discountPaise,
        couponId,
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
      originalAmount,
      discount: discountPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      courseTitle: course.title,
    };
  },

  async createTestOrder(userId: string, testId: string, _couponCode?: string) {
    const test = await prisma.writtenTest.findUnique({ where: { id: testId } });
    if (!test || test.status !== 'PUBLISHED') throw ApiError.notFound('Test not found.');

    const now = new Date();
    if (now > test.availableTo) throw ApiError.forbidden('This test is no longer available for purchase.');

    const existing = await prisma.writtenTestEnrollment.findUnique({
      where: { userId_testId: { userId, testId } },
    });
    if (existing) throw ApiError.conflict('You are already enrolled in this test.');

    const feesNumber = test.price ?? 0;
    if (!feesNumber || feesNumber <= 0) {
      await writtenTestService.enroll(userId, testId);
      return { free: true as const, enrolled: true };
    }

    if (!isRazorpayConfigured) {
      throw ApiError.internal('Online payments are not configured. Please contact the academy.');
    }

    const amount = Math.max(100, Math.round(feesNumber * 100));
    const receipt = `bda_t_${testId.slice(0, 8)}_${Date.now()}`.slice(0, 40);

    await prisma.payment.updateMany({
      where: { userId, testId, status: 'CREATED' },
      data: { status: 'FAILED' },
    });

    let order: { id: string };
    try {
      order = await getRazorpay().orders.create({
        amount,
        currency: 'INR',
        receipt,
        notes: { testId, userId, kind: 'written_test' },
      });
    } catch (err) {
      throwRazorpayError(err);
    }

    await prisma.payment.create({
      data: {
        userId,
        testId,
        amount,
        originalAmount: amount,
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
      originalAmount: amount,
      discount: 0,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      courseTitle: test.title,
      testTitle: test.title,
    };
  },

  async verifyAndEnroll(
    userId: string,
    input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string },
  ) {
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: input.razorpayOrderId } });
    if (!payment || payment.userId !== userId) throw ApiError.notFound('Payment not found.');
    if (payment.status === 'PAID') {
      return { enrolled: true, courseId: payment.courseId, testId: payment.testId };
    }

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
      data: { razorpaySignature: input.razorpaySignature },
    });

    return this.markPaidAndEnroll(payment, input.razorpayPaymentId);
  },

  async markPaidAndEnroll(
    payment: {
      id: string;
      userId: string;
      courseId: string | null;
      testId?: string | null;
      status: string;
    },
    paymentId?: string,
  ) {
    const wasPaid = payment.status === 'PAID';
    if (!wasPaid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'PAID', ...(paymentId ? { razorpayPaymentId: paymentId } : {}) },
      });
      const full = await prisma.payment.findUnique({
        where: { id: payment.id },
        select: { couponId: true, discountApplied: true, testId: true, courseId: true },
      });
      if (full?.couponId) {
        await couponService.redeem(full.couponId, payment.userId, payment.id, full.discountApplied);
      }
      payment = {
        ...payment,
        testId: full?.testId ?? payment.testId,
        courseId: full?.courseId ?? payment.courseId,
      };
    }

    if (payment.testId) {
      try {
        await writtenTestService.enroll(payment.userId, payment.testId, payment.id);
      } catch {
        /* already enrolled */
      }
      return { enrolled: true, testId: payment.testId, courseId: null as string | null };
    }

    if (payment.courseId) {
      try {
        await studentService.enroll(payment.userId, payment.courseId);
      } catch {
        /* already enrolled */
      }
      return { enrolled: true, courseId: payment.courseId, testId: null as string | null };
    }

    throw ApiError.internal('Payment has no course or test target.');
  },

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw ApiError.internal('RAZORPAY_WEBHOOK_SECRET is not configured.');
    if (!signature) throw ApiError.badRequest('Missing webhook signature.');

    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const valid =
      expected.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    if (!valid) throw ApiError.badRequest('Invalid webhook signature.');

    const body = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string } };
        order?: { entity?: { id?: string } };
      };
    };

    const event = body.event ?? '';
    if (event !== 'payment.captured' && event !== 'order.paid') {
      return { handled: false, event };
    }

    const orderId = body.payload?.payment?.entity?.order_id ?? body.payload?.order?.entity?.id;
    const paymentId = body.payload?.payment?.entity?.id;
    if (!orderId) return { handled: false, event };

    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } });
    if (!payment) return { handled: false, event };

    await this.markPaidAndEnroll(payment, paymentId);
    return { handled: true, event };
  },

  listMine(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { title: true, slug: true } },
        test: { select: { title: true, slug: true } },
      },
    });
  },
};
