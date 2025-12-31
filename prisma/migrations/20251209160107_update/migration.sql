-- CreateEnum
CREATE TYPE "LessonReviewStatus" AS ENUM ('new', 'learning', 'reviewing', 'lapsed', 'suspending');

-- AlterTable
ALTER TABLE "lesson" ADD COLUMN     "is_reviewing" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LessonReviewSetting" (
    "id" TEXT NOT NULL,
    "easiness_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "status" "LessonReviewStatus" NOT NULL DEFAULT 'new',
    "review_step" INTEGER NOT NULL DEFAULT 1,
    "lapsed" INTEGER NOT NULL DEFAULT 0,
    "lesson_id" TEXT NOT NULL,

    CONSTRAINT "LessonReviewSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonReviewSetting_lesson_id_key" ON "LessonReviewSetting"("lesson_id");

-- AddForeignKey
ALTER TABLE "LessonReviewSetting" ADD CONSTRAINT "LessonReviewSetting_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
