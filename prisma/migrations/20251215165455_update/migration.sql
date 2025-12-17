/*
  Warnings:

  - You are about to drop the column `intervalMinutes` on the `LessonReviewSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LessonReviewSetting" DROP COLUMN "intervalMinutes",
ADD COLUMN     "interval_minutes" INTEGER NOT NULL DEFAULT 0;
