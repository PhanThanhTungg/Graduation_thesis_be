-- CreateEnum
CREATE TYPE "public"."LessonProgress" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "public"."user_lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "progress" "public"."LessonProgress" NOT NULL DEFAULT 'not_started',

    CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
