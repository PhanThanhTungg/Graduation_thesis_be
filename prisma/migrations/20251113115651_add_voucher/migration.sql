-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('percentage', 'fixed_amount');

-- CreateTable
CREATE TABLE "public"."voucher" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "course_id" TEXT,
    "discount_type" "public"."DiscountType" NOT NULL,
    "discount_value" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "usage_limit" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "status" "public"."Status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "voucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "voucher_code_key" ON "public"."voucher"("code");

-- AddForeignKey
ALTER TABLE "public"."voucher" ADD CONSTRAINT "voucher_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."voucher" ADD CONSTRAINT "voucher_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
