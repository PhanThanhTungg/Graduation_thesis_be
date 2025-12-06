/*
  Warnings:

  - You are about to drop the column `is_for_ai` on the `file` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "file" DROP COLUMN "is_for_ai",
ADD COLUMN     "is_for_ai_ques" BOOLEAN NOT NULL DEFAULT false;
