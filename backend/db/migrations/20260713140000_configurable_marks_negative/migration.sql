-- AlterTable: configurable marks per question + float scoring
ALTER TABLE "written_tests" ADD COLUMN "marksPerQuestion" DOUBLE PRECISION NOT NULL DEFAULT 1;

ALTER TABLE "written_tests" ALTER COLUMN "passingMarks" SET DATA TYPE DOUBLE PRECISION;

ALTER TABLE "written_test_questions" ALTER COLUMN "marks" SET DATA TYPE DOUBLE PRECISION;

ALTER TABLE "written_test_attempts" ALTER COLUMN "totalMarks" SET DATA TYPE DOUBLE PRECISION;
