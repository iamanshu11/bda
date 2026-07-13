-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CouponStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REFUNDED';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "discountApplied" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "originalAmount" INTEGER,
ADD COLUMN     "refundId" TEXT;

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL DEFAULT 'PERCENTAGE',
    "value" INTEGER NOT NULL,
    "maxDiscount" INTEGER,
    "minAmount" INTEGER,
    "expiryAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "courseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "discountApplied" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_status_idx" ON "coupons"("status");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_paymentId_key" ON "coupon_redemptions"("paymentId");

-- CreateIndex
CREATE INDEX "coupon_redemptions_userId_idx" ON "coupon_redemptions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_couponId_userId_key" ON "coupon_redemptions"("couponId", "userId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
