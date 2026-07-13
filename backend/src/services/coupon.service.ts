import { prisma } from '@/config/prisma';
import { ApiError } from '@/utils/ApiError';

export interface CouponEvaluation {
  couponId: string;
  code: string;
  /** Discount in rupees. */
  discount: number;
  /** Original course price in rupees. */
  originalAmount: number;
  /** Payable amount after discount, in rupees. */
  finalAmount: number;
}

/**
 * Coupon validation + discount calculation. Always re-validated server-side
 * (never trust a client-sent discount).
 */
export const couponService = {
  /**
   * Validate a coupon for a user + course and compute the discount.
   * Throws ApiError with a friendly message when invalid.
   */
  async evaluate(userId: string, rawCode: string, courseId: string): Promise<CouponEvaluation> {
    const code = rawCode.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || coupon.status !== 'ACTIVE') throw ApiError.badRequest('Invalid coupon code.');
    if (coupon.expiryAt && coupon.expiryAt < new Date()) throw ApiError.badRequest('This coupon has expired.');
    if (coupon.courseId && coupon.courseId !== courseId) {
      throw ApiError.badRequest('This coupon is not valid for this course.');
    }
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
      throw ApiError.badRequest('This coupon has reached its usage limit.');
    }

    const usedByUser = await prisma.couponRedemption.count({ where: { couponId: coupon.id, userId } });
    if (usedByUser >= coupon.perUserLimit) {
      throw ApiError.badRequest('You have already used this coupon.');
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw ApiError.notFound('Course not found.');
    const originalAmount = course.fees ? Number(course.fees) : 0;
    if (originalAmount <= 0) throw ApiError.badRequest('This course is free — no coupon needed.');
    if (coupon.minAmount != null && originalAmount < coupon.minAmount) {
      throw ApiError.badRequest(`This coupon requires a minimum price of ₹${coupon.minAmount}.`);
    }

    let discount =
      coupon.type === 'PERCENTAGE' ? Math.floor((originalAmount * coupon.value) / 100) : coupon.value;
    if (coupon.type === 'PERCENTAGE' && coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    discount = Math.max(0, Math.min(discount, originalAmount)); // never below zero

    return {
      couponId: coupon.id,
      code: coupon.code,
      discount,
      originalAmount,
      finalAmount: originalAmount - discount,
    };
  },

  /** Record a redemption + increment usage (called once a payment is captured). */
  async redeem(couponId: string, userId: string, paymentId: string, discountPaise: number) {
    const existing = await prisma.couponRedemption.findUnique({ where: { paymentId } });
    if (existing) return; // idempotent
    await prisma.$transaction([
      prisma.couponRedemption.create({
        data: { couponId, userId, paymentId, discountApplied: discountPaise },
      }),
      prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } }),
    ]);
  },
};
