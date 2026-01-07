-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'order';

-- AlterTable
ALTER TABLE "disk_space_teacher" ALTER COLUMN "to" SET DEFAULT NOW() + INTERVAL '30 days';
