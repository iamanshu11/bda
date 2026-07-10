-- CreateEnum
CREATE TYPE "CorrectOption" AS ENUM ('A', 'B', 'C', 'D');

-- CreateTable
CREATE TABLE "course_modules" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "moduleNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "youtubeUrl" TEXT,
    "youtubeIframe" TEXT,
    "notes" TEXT,
    "attachmentUrl" TEXT,
    "estimatedDuration" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_quizzes" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "passingMarks" INTEGER NOT NULL DEFAULT 7,
    "totalQuestions" INTEGER NOT NULL DEFAULT 10,
    "shuffleQuestions" BOOLEAN NOT NULL DEFAULT false,
    "shuffleOptions" BOOLEAN NOT NULL DEFAULT false,
    "attemptLimit" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_questions" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" "CorrectOption" NOT NULL,
    "explanation" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_module_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "videoCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notesCompleted" BOOLEAN NOT NULL DEFAULT false,
    "quizAttempted" BOOLEAN NOT NULL DEFAULT false,
    "quizScore" INTEGER,
    "quizPassed" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_module_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_modules_courseId_idx" ON "course_modules"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "course_modules_courseId_moduleNumber_key" ON "course_modules"("courseId", "moduleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "module_quizzes_moduleId_key" ON "module_quizzes"("moduleId");

-- CreateIndex
CREATE INDEX "module_questions_quizId_idx" ON "module_questions"("quizId");

-- CreateIndex
CREATE INDEX "student_module_progress_userId_idx" ON "student_module_progress"("userId");

-- CreateIndex
CREATE INDEX "student_module_progress_moduleId_idx" ON "student_module_progress"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "student_module_progress_userId_moduleId_key" ON "student_module_progress"("userId", "moduleId");

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_quizzes" ADD CONSTRAINT "module_quizzes_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_questions" ADD CONSTRAINT "module_questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "module_quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_module_progress" ADD CONSTRAINT "student_module_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_module_progress" ADD CONSTRAINT "student_module_progress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "course_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
