-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('teacher', 'student');

-- CreateEnum
CREATE TYPE "public"."AdminObject" AS ENUM ('user_management', 'course_management', 'category_management');

-- CreateEnum
CREATE TYPE "public"."AdminAction" AS ENUM ('view', 'edit');

-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('active', 'inactive');

-- CreateTable
CREATE TABLE "public"."admin" (
    "id" TEXT NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "admin_role_id" TEXT NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_role" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,

    CONSTRAINT "admin_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_role_permission" (
    "id_admin_role" TEXT NOT NULL,
    "id_admin_permission" TEXT NOT NULL,

    CONSTRAINT "admin_role_permission_pkey" PRIMARY KEY ("id_admin_role","id_admin_permission")
);

-- CreateTable
CREATE TABLE "public"."admin_permission" (
    "id" TEXT NOT NULL,
    "object" "public"."AdminObject" NOT NULL,
    "action" "public"."AdminAction" NOT NULL,

    CONSTRAINT "admin_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "facebook_id" TEXT,
    "full_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "email_verified" BOOLEAN DEFAULT false,
    "avatar_url" TEXT,
    "status" "public"."Status" NOT NULL DEFAULT 'active',
    "country" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teacher_setting" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bio" TEXT,
    "headline" TEXT,
    "country" TEXT,
    "website" TEXT,
    "facebook" TEXT,
    "linkedin" TEXT,
    "youtube" TEXT,

    CONSTRAINT "teacher_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."category" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "slug" TEXT,
    "parent_id" TEXT,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."courses" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "course_description_id" TEXT,
    "thumbnail_url" VARCHAR(255),
    "teacher_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "count_student" INTEGER,
    "category_id" TEXT,
    "slug" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."course_description" (
    "id" TEXT NOT NULL,
    "headline" TEXT,
    "target_knowledges" TEXT,
    "requirement" TEXT,
    "detail" TEXT,
    "suitable_participant" TEXT,

    CONSTRAINT "course_description_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "public"."admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_setting_user_id_key" ON "public"."teacher_setting"("user_id");

-- AddForeignKey
ALTER TABLE "public"."admin" ADD CONSTRAINT "admin_admin_role_id_fkey" FOREIGN KEY ("admin_role_id") REFERENCES "public"."admin_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_role_permission" ADD CONSTRAINT "admin_role_permission_id_admin_role_fkey" FOREIGN KEY ("id_admin_role") REFERENCES "public"."admin_role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_role_permission" ADD CONSTRAINT "admin_role_permission_id_admin_permission_fkey" FOREIGN KEY ("id_admin_permission") REFERENCES "public"."admin_permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_setting" ADD CONSTRAINT "teacher_setting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category" ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_course_description_id_fkey" FOREIGN KEY ("course_description_id") REFERENCES "public"."course_description"("id") ON DELETE SET NULL ON UPDATE CASCADE;
