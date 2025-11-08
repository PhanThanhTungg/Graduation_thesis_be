-- CreateEnum
CREATE TYPE "public"."LessonType" AS ENUM ('video', 'theory', 'exercise');

-- CreateTable
CREATE TABLE "public"."chapter" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lesson" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" "public"."LessonType" NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."video_lesson" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "video_lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."theory_file" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "theory_file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercise_file" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "exercise_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "video_lesson_lesson_id_key" ON "public"."video_lesson"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "theory_file_lesson_id_key" ON "public"."theory_file"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_file_lesson_id_key" ON "public"."exercise_file"("lesson_id");

-- AddForeignKey
ALTER TABLE "public"."chapter" ADD CONSTRAINT "chapter_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chapter" ADD CONSTRAINT "chapter_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."chapter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."lesson" ADD CONSTRAINT "lesson_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."video_lesson" ADD CONSTRAINT "video_lesson_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."theory_file" ADD CONSTRAINT "theory_file_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercise_file" ADD CONSTRAINT "exercise_file_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
