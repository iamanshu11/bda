-- AlterTable
ALTER TABLE "course_modules" ADD COLUMN     "isPreview" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "course_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_reviews_courseId_idx" ON "course_reviews"("courseId");

-- CreateIndex
CREATE INDEX "course_reviews_isApproved_idx" ON "course_reviews"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "course_reviews_userId_courseId_key" ON "course_reviews"("userId", "courseId");

-- CreateIndex
CREATE INDEX "wishlists_userId_idx" ON "wishlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_userId_courseId_key" ON "wishlists"("userId", "courseId");

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
