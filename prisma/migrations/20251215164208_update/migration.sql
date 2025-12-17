/*
  Warnings:

  - You are about to drop the column `intervalDays` on the `LessonReviewSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LessonReviewSetting" DROP COLUMN "intervalDays",
ADD COLUMN     "intervalMinutes" INTEGER NOT NULL DEFAULT 0;
