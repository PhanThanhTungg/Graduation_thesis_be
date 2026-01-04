/*
  Warnings:

  - You are about to drop the `system_fee` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "admin_setting" ADD COLUMN     "fee_upload_per_100_mb" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
ADD COLUMN     "percent_commission" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- DropTable
DROP TABLE "system_fee";
