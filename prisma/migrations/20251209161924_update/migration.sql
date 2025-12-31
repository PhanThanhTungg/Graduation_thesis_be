/*
  Warnings:

  - You are about to drop the column `is_reviewing` on the `lesson` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `LessonReviewSetting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LessonReviewSetting" ADD COLUMN     "review_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "lesson" DROP COLUMN "is_reviewing";

-- AddForeignKey
ALTER TABLE "LessonReviewSetting" ADD CONSTRAINT "LessonReviewSetting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
