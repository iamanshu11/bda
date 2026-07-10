-- CreateEnum
CREATE TYPE "XpAction" AS ENUM ('VIDEO_WATCHED', 'NOTES_READ', 'QUIZ_PASSED', 'LIVE_CLASS_ATTENDED', 'COURSE_COMPLETED');

-- CreateEnum
CREATE TYPE "AchievementCode" AS ENUM ('FIRST_MISSION', 'STREAK_7', 'QUIZ_MASTER', 'PERFECT_ATTENDANCE', 'CONSTITUTION_EXPERT', 'MATHS_WARRIOR', 'DEFENCE_SCHOLAR');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "totalXp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "xp_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "XpAction" NOT NULL,
    "amount" INTEGER NOT NULL,
    "referenceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achievements" (
    "id" TEXT NOT NULL,
    "code" "AchievementCode" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_class_attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "liveClassId" TEXT NOT NULL,
    "attendedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_class_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "xp_transactions_userId_idx" ON "xp_transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "xp_transactions_userId_action_referenceId_key" ON "xp_transactions"("userId", "action", "referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "achievements_code_key" ON "achievements"("code");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "live_class_attendance_userId_idx" ON "live_class_attendance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "live_class_attendance_userId_liveClassId_key" ON "live_class_attendance"("userId", "liveClassId");

-- AddForeignKey
ALTER TABLE "xp_transactions" ADD CONSTRAINT "xp_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "achievements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_class_attendance" ADD CONSTRAINT "live_class_attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_class_attendance" ADD CONSTRAINT "live_class_attendance_liveClassId_fkey" FOREIGN KEY ("liveClassId") REFERENCES "live_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
