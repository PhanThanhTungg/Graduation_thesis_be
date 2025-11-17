/*
  Warnings:

  - A unique constraint covering the columns `[order_id]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_id` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order" ADD COLUMN     "order_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "order_order_id_key" ON "order"("order_id");
