-- AlterTable
ALTER TABLE "public"."courses" ADD COLUMN     "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."file" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."lesson" ADD COLUMN     "view_count" INTEGER NOT NULL DEFAULT 0;
