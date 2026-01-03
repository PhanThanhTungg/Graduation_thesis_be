/*
  Warnings:

  - The values [user_management,course_management,category_management] on the enum `AdminObject` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminAction" ADD VALUE 'delete';
ALTER TYPE "AdminAction" ADD VALUE 'create';

-- AlterEnum
BEGIN;
CREATE TYPE "AdminObject_new" AS ENUM ('dashboard', 'course', 'category', 'transaction', 'payment', 'user', 'permission', 'admin', 'setting');
ALTER TABLE "admin_permission" ALTER COLUMN "object" TYPE "AdminObject_new" USING ("object"::text::"AdminObject_new");
ALTER TYPE "AdminObject" RENAME TO "AdminObject_old";
ALTER TYPE "AdminObject_new" RENAME TO "AdminObject";
DROP TYPE "public"."AdminObject_old";
COMMIT;
