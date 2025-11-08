/*
  Warnings:

  - You are about to drop the column `type` on the `lesson` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."lesson" DROP COLUMN "type";

-- DropEnum
DROP TYPE "public"."LessonType";
