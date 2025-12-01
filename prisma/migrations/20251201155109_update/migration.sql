-- AlterTable
ALTER TABLE "lesson" ADD COLUMN     "is_gen_ques" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_gen_quiz" BOOLEAN NOT NULL DEFAULT false;
