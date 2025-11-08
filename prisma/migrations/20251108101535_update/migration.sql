/*
  Warnings:

  - You are about to drop the column `video_url` on the `video_lesson` table. All the data in the column will be lost.
  - Added the required column `embed_url` to the `video_lesson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video_id` to the `video_lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."video_lesson" DROP COLUMN "video_url",
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "embed_url" TEXT NOT NULL,
ADD COLUMN     "video_id" TEXT NOT NULL;
