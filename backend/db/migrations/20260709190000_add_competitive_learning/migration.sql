-- AlterEnum
ALTER TYPE "XpAction" ADD VALUE 'QUIZ_BATTLE_WON';
ALTER TYPE "XpAction" ADD VALUE 'QUIZ_BATTLE_PARTICIPATED';

-- CreateEnum
CREATE TYPE "BattleStatus" AS ENUM ('LOBBY', 'LIVE', 'FINISHED', 'CANCELLED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "state" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "academyId" TEXT;

-- CreateTable
CREATE TABLE "academies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "academies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_battles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "categoryId" TEXT,
    "status" "BattleStatus" NOT NULL DEFAULT 'LOBBY',
    "maxPlayers" INTEGER NOT NULL DEFAULT 50,
    "timePerQuestion" INTEGER NOT NULL DEFAULT 30,
    "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
    "questionStartedAt" TIMESTAMP(3),
    "xpRewardWinner" INTEGER NOT NULL DEFAULT 50,
    "xpRewardParticipant" INTEGER NOT NULL DEFAULT 15,
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "quiz_battles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_battle_questions" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "optionA" TEXT NOT NULL,
    "optionB" TEXT NOT NULL,
    "optionC" TEXT NOT NULL,
    "optionD" TEXT NOT NULL,
    "correctOption" "CorrectOption" NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "quiz_battle_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_battle_participants" (
    "id" TEXT NOT NULL,
    "battleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "quiz_battle_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_battle_answers" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selected" "CorrectOption",
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "timeMs" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "quiz_battle_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "academies_name_key" ON "academies"("name");
CREATE INDEX "users_academyId_idx" ON "users"("academyId");
CREATE INDEX "users_state_idx" ON "users"("state");
CREATE INDEX "users_totalXp_idx" ON "users"("totalXp");
CREATE INDEX IF NOT EXISTS "xp_transactions_createdAt_idx" ON "xp_transactions"("createdAt");
CREATE INDEX "quiz_battles_status_idx" ON "quiz_battles"("status");
CREATE INDEX "quiz_battles_courseId_idx" ON "quiz_battles"("courseId");
CREATE INDEX "quiz_battle_questions_battleId_idx" ON "quiz_battle_questions"("battleId");
CREATE UNIQUE INDEX "quiz_battle_participants_battleId_userId_key" ON "quiz_battle_participants"("battleId", "userId");
CREATE INDEX "quiz_battle_participants_battleId_idx" ON "quiz_battle_participants"("battleId");
CREATE INDEX "quiz_battle_participants_userId_idx" ON "quiz_battle_participants"("userId");
CREATE UNIQUE INDEX "quiz_battle_answers_participantId_questionId_key" ON "quiz_battle_answers"("participantId", "questionId");
CREATE INDEX "quiz_battle_answers_participantId_idx" ON "quiz_battle_answers"("participantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_academyId_fkey" FOREIGN KEY ("academyId") REFERENCES "academies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quiz_battles" ADD CONSTRAINT "quiz_battles_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quiz_battles" ADD CONSTRAINT "quiz_battles_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "course_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "quiz_battle_questions" ADD CONSTRAINT "quiz_battle_questions_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "quiz_battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_battle_participants" ADD CONSTRAINT "quiz_battle_participants_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "quiz_battles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_battle_participants" ADD CONSTRAINT "quiz_battle_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_battle_answers" ADD CONSTRAINT "quiz_battle_answers_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "quiz_battle_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "quiz_battle_answers" ADD CONSTRAINT "quiz_battle_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "quiz_battle_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
