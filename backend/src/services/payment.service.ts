import crypto from 'crypto';
import { prisma } from '@/config/prisma';
import { env } from '@/config/env';
import { getRazorpay, isRazorpayConfigured } from '@/config/razorpay';
import { ApiError } from '@/utils/ApiError';
import { studentService } from '@/services/student.service';
import { couponService } from '@/services/coupon.service';
import { writtenTestService } from '@/services/writtenTest.service';
import { notificationService } from '@/services/notification.service';
import { emailService } from '@/services/email.service';
import { emailTemplates } from '@/emails/templates';
import { verifyRazorpaySignature, verifyWebhookSignature } from '@/utils/paymentSignature';

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

    const signatureValid = verifyRazorpaySignature(
      input.razorpayOrderId,
      input.razorpayPaymentId,
      input.razorpaySignature,
      env.RAZORPAY_KEY_SECRET,
    );

    if (!signatureValid) {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
      throw ApiError.badRequest('Payment verification failed.');
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { razorpaySignature: input.razorpaySignature },
    });

    return this.markPaidAndEnroll(payment, input.razorpayPaymentId);
  },

  /**
   * Atomically mark a payment PAID, redeem any coupon, and enroll the buyer.
   * All DB writes happen inside a single interactive transaction, so we can
   * never end up "paid but not enrolled" (or coupon counted without enrollment).
   * The whole method is idempotent: re-running it (duplicate webhook, retry,
   * or a reconciliation job) will not double-enroll or double-count a coupon.
   * User-facing side effects (notification + email) run AFTER commit so a slow
   * mailer can never roll back a successful payment.
   */
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
    const outcome = await prisma.$transaction(async (tx) => {
      const pay = await tx.payment.findUnique({
        where: { id: payment.id },
        select: {
          id: true,
          userId: true,
          status: true,
          couponId: true,
          discountApplied: true,
          testId: true,
          courseId: true,
        },
      });
      if (!pay) throw ApiError.notFound('Payment not found.');

      // 1) Mark PAID + redeem coupon (only on the first successful pass).
      if (pay.status !== 'PAID') {
        await tx.payment.update({
          where: { id: pay.id },
          data: { status: 'PAID', ...(paymentId ? { razorpayPaymentId: paymentId } : {}) },
        });
        if (pay.couponId) {
          const already = await tx.couponRedemption.findUnique({ where: { paymentId: pay.id } });
          if (!already) {
            await tx.couponRedemption.create({
              data: {
                couponId: pay.couponId,
                userId: pay.userId,
                paymentId: pay.id,
                discountApplied: pay.discountApplied,
              },
            });
            await tx.coupon.update({
              where: { id: pay.couponId },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
      }

      // 2) Enroll (idempotent). Written test takes precedence when both set.
      if (pay.testId) {
        await tx.writtenTestEnrollment.upsert({
          where: { userId_testId: { userId: pay.userId, testId: pay.testId } },
          update: { paymentId: pay.id },
          create: { userId: pay.userId, testId: pay.testId, paymentId: pay.id },
        });
        return { userId: pay.userId, testId: pay.testId, courseId: null as string | null, newCourse: false, courseTitle: '' };
      }

      if (pay.courseId) {
        const existing = await tx.enrollment.findUnique({
          where: { userId_courseId: { userId: pay.userId, courseId: pay.courseId } },
        });
        let newCourse = false;
        if (!existing) {
          await tx.enrollment.create({
            data: { userId: pay.userId, courseId: pay.courseId, status: 'ACTIVE' },
          });
          newCourse = true;
        }
        const course = await tx.course.findUnique({
          where: { id: pay.courseId },
          select: { title: true },
        });
        return {
          userId: pay.userId,
          testId: null as string | null,
          courseId: pay.courseId,
          newCourse,
          courseTitle: course?.title ?? '',
        };
      }

      throw ApiError.internal('Payment has no course or test target.');
    });

    // Post-commit side effects (safe to fail without affecting the payment).
    if (outcome.newCourse && outcome.courseId) {
      notificationService.emit(
        outcome.userId,
        'Enrolled successfully',
        `You are now enrolled in ${outcome.courseTitle}. Start learning!`,
      );
      const user = await prisma.user.findUnique({ where: { id: outcome.userId } });
      if (user) {
        void emailService
          .send(
            user.email,
            'Enrollment confirmed — Bokaro Defence Academy',
            emailTemplates.enrollmentConfirmation(user.name, outcome.courseTitle),
          )
          .catch(() => undefined);
      }
    }

    return { enrolled: true, courseId: outcome.courseId, testId: outcome.testId };
  },

  async handleWebhook(rawBody: Buffer, signature: string | undefined) {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw ApiError.internal('RAZORPAY_WEBHOOK_SECRET is not configured.');
    if (!signature) throw ApiError.badRequest('Missing webhook signature.');

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      throw ApiError.badRequest('Invalid webhook signature.');
    }

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
