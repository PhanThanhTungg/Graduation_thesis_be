/*
  Warnings:

  - You are about to drop the column `bank_account` on the `withdrawal` table. All the data in the column will be lost.
  - You are about to drop the column `bank_account_name` on the `withdrawal` table. All the data in the column will be lost.
  - You are about to drop the column `bank_name` on the `withdrawal` table. All the data in the column will be lost.
  - Added the required column `email` to the `withdrawal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "withdrawal" DROP COLUMN "bank_account",
DROP COLUMN "bank_account_name",
DROP COLUMN "bank_name",
ADD COLUMN     "email" TEXT NOT NULL;
