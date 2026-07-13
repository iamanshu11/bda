-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "courseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "testId" TEXT;

-- CreateEnum
CREATE TYPE "TestStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TestAttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ExamViolationType" AS ENUM ('WINDOW_MINIMIZED', 'TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'PAGE_REFRESH', 'DEVTOOLS', 'CLIPBOARD', 'RIGHT_CLICK', 'SHORTCUT', 'MULTI_TAB', 'MULTI_DEVICE', 'OFFLINE');

-- CreateTable
CREATE TABLE "written_tests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "price" INTEGER NOT NULL DEFAULT 299,
    "durationMins" INTEGER,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "passingMarks" INTEGER,
    "negativeMark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shuffle" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3) NOT NULL,
    "availableTo" TIMESTAMP(3) NOT NULL,
    "answersRevealAt" TIMESTAMP(3),
    "status" "TestStatus" NOT NULL DEFAULT 'DRAFT',
    "maxCheatingAttempts" INTEGER NOT NULL DEFAULT 3,
    "offlineAutoSubmitMins" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "written_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "written_test_questions" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" "CorrectOption" NOT NULL,
    "explanation" TEXT,
    "marks" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "written_test_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "written_test_enrollments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "written_test_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "written_test_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "status" "TestAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "totalMarks" INTEGER,
    "correct" INTEGER,
    "wrong" INTEGER,
    "answers" JSONB,
    "cheatingCount" INTEGER NOT NULL DEFAULT 0,
    "sessionToken" TEXT,
    "lastHeartbeatAt" TIMESTAMP(3),
    "currentQuestionIndex" INTEGER,
    "clientIp" TEXT,
    "userAgent" TEXT,
    "autoSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "autoSubmitReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "written_test_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_violations" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "type" "ExamViolationType" NOT NULL,
    "browser" TEXT,
    "os" TEXT,
    "device" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "written_tests_slug_key" ON "written_tests"("slug");

-- CreateIndex
CREATE INDEX "written_tests_status_idx" ON "written_tests"("status");

-- CreateIndex
CREATE INDEX "written_tests_availableFrom_availableTo_idx" ON "written_tests"("availableFrom", "availableTo");

-- CreateIndex
CREATE INDEX "written_test_questions_testId_idx" ON "written_test_questions"("testId");

-- CreateIndex
CREATE INDEX "written_test_enrollments_testId_idx" ON "written_test_enrollments"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "written_test_enrollments_userId_testId_key" ON "written_test_enrollments"("userId", "testId");

-- CreateIndex
CREATE INDEX "written_test_attempts_testId_idx" ON "written_test_attempts"("testId");

-- CreateIndex
CREATE INDEX "written_test_attempts_status_idx" ON "written_test_attempts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "written_test_attempts_userId_testId_key" ON "written_test_attempts"("userId", "testId");

-- CreateIndex
CREATE INDEX "exam_violations_attemptId_idx" ON "exam_violations"("attemptId");

-- CreateIndex
CREATE INDEX "exam_violations_testId_idx" ON "exam_violations"("testId");

-- CreateIndex
CREATE INDEX "exam_violations_userId_idx" ON "exam_violations"("userId");

-- CreateIndex
CREATE INDEX "exam_violations_createdAt_idx" ON "exam_violations"("createdAt");

-- CreateIndex
CREATE INDEX "payments_testId_idx" ON "payments"("testId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_testId_fkey" FOREIGN KEY ("testId") REFERENCES "written_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "written_test_questions" ADD CONSTRAINT "written_test_questions_testId_fkey" FOREIGN KEY ("testId") REFERENCES "written_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "written_test_enrollments" ADD CONSTRAINT "written_test_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "written_test_enrollments" ADD CONSTRAINT "written_test_enrollments_testId_fkey" FOREIGN KEY ("testId") REFERENCES "written_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "written_test_attempts" ADD CONSTRAINT "written_test_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "written_test_attempts" ADD CONSTRAINT "written_test_attempts_testId_fkey" FOREIGN KEY ("testId") REFERENCES "written_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_violations" ADD CONSTRAINT "exam_violations_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "written_test_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_violations" ADD CONSTRAINT "exam_violations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_violations" ADD CONSTRAINT "exam_violations_testId_fkey" FOREIGN KEY ("testId") REFERENCES "written_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
