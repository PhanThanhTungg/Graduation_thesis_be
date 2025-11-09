-- DropForeignKey
ALTER TABLE "public"."admin" DROP CONSTRAINT "admin_admin_role_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."admin_role_permission" DROP CONSTRAINT "admin_role_permission_id_admin_permission_fkey";

-- DropForeignKey
ALTER TABLE "public"."admin_role_permission" DROP CONSTRAINT "admin_role_permission_id_admin_role_fkey";

-- DropForeignKey
ALTER TABLE "public"."category" DROP CONSTRAINT "category_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."chapter" DROP CONSTRAINT "chapter_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."courses" DROP CONSTRAINT "courses_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."courses" DROP CONSTRAINT "courses_course_description_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."courses" DROP CONSTRAINT "courses_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."teacher_setting" DROP CONSTRAINT "teacher_setting_user_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."admin" ADD CONSTRAINT "admin_admin_role_id_fkey" FOREIGN KEY ("admin_role_id") REFERENCES "public"."admin_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_role_permission" ADD CONSTRAINT "admin_role_permission_id_admin_role_fkey" FOREIGN KEY ("id_admin_role") REFERENCES "public"."admin_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_role_permission" ADD CONSTRAINT "admin_role_permission_id_admin_permission_fkey" FOREIGN KEY ("id_admin_permission") REFERENCES "public"."admin_permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teacher_setting" ADD CONSTRAINT "teacher_setting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."category" ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."courses" ADD CONSTRAINT "courses_course_description_id_fkey" FOREIGN KEY ("course_description_id") REFERENCES "public"."course_description"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."chapter" ADD CONSTRAINT "chapter_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
