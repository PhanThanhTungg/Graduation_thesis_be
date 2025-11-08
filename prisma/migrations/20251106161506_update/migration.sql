/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `chapter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `lesson` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `chapter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `lesson` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."chapter" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."lesson" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "chapter_slug_key" ON "public"."chapter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_slug_key" ON "public"."lesson"("slug");
