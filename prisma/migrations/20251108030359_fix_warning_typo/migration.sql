/*
  Warnings:

  - The values [warining] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Status_new" AS ENUM ('active', 'warning', 'inactive');
ALTER TABLE "public"."user" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."user" ALTER COLUMN "status" TYPE "public"."Status_new" USING ("status"::text::"public"."Status_new");
ALTER TYPE "public"."Status" RENAME TO "Status_old";
ALTER TYPE "public"."Status_new" RENAME TO "Status";
DROP TYPE "public"."Status_old";
ALTER TABLE "public"."user" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;
