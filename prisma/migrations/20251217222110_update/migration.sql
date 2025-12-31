/*
  Warnings:

  - You are about to drop the column `interval_minutes` on the `LessonReviewSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LessonReviewSetting" DROP COLUMN "interval_minutes",
ADD COLUMN     "interval" INTEGER NOT NULL DEFAULT 0;
