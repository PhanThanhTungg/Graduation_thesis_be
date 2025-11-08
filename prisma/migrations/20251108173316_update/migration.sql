/*
  Warnings:

  - You are about to drop the `theory_file` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."theory_file" DROP CONSTRAINT "theory_file_lesson_id_fkey";

-- DropTable
DROP TABLE "public"."theory_file";

-- CreateTable
CREATE TABLE "public"."file" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."file" ADD CONSTRAINT "file_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
