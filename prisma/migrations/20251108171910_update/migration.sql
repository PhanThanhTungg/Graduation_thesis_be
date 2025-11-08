/*
  Warnings:

  - You are about to drop the `exercise_file` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."exercise_file" DROP CONSTRAINT "exercise_file_lesson_id_fkey";

-- DropTable
DROP TABLE "public"."exercise_file";
