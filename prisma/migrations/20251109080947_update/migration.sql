/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `chapter` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `file` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `lesson` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `video_lesson` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."chapter" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "public"."file" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "public"."lesson" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "public"."video_lesson" DROP COLUMN "deleted_at";
