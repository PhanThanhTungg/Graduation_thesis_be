-- CreateEnum
CREATE TYPE "TypeQuestion" AS ENUM ('single_choice', 'multiple_choice', 'fill_in_the_blank', 'short_answer', 'true_false');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('very_easy', 'easy', 'medium', 'hard', 'very_hard');

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "statement" TEXT NOT NULL,
    "answer" TEXT,
    "score" INTEGER,
    "explain" TEXT,
    "aiFeedback" TEXT,
    "type" "TypeQuestion" NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'medium',
    "lesson_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
