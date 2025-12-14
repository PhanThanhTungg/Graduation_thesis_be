-- AlterTable
ALTER TABLE "LessonReviewSetting" ADD COLUMN     "last_reviewed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "is_for_review" BOOLEAN NOT NULL DEFAULT false;
