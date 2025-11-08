/*
  Warnings:

  - You are about to drop the column `duration` on the `lesson` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."lesson" DROP COLUMN "duration";

-- AlterTable
ALTER TABLE "public"."video_lesson" ADD COLUMN     "duration" INTEGER;
