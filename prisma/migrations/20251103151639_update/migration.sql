/*
  Warnings:

  - A unique constraint covering the columns `[course_description_id]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `courses` will be added. If there are existing duplicate values, this will fail.
  - Made the column `course_description_id` on table `courses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `count_student` on table `courses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `category_id` on table `courses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `courses` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."courses" DROP CONSTRAINT "courses_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."courses" DROP CONSTRAINT "courses_course_description_id_fkey";

-- AlterTable
ALTER TABLE "public"."courses" ALTER COLUMN "course_description_id" SET NOT NULL,
ALTER COLUMN "count_student" SET NOT NULL,
ALTER COLUMN "count_student" SET DEFAULT 0,
ALTER COLUMN "category_id" SET NOT NULL,
ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "courses_course_description_id_key" ON "public"."courses"("course_description_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_slug_key" ON "public"."courses"("slug");

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_course_description_id_fkey" FOREIGN KEY ("course_description_id") REFERENCES "public"."course_description"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
