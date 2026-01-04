-- AlterEnum
ALTER TYPE "PlatformTransactionType" ADD VALUE 'disk_space_income';

-- AlterTable
ALTER TABLE "disk_space_teacher" ALTER COLUMN "to" SET DEFAULT NOW() + INTERVAL '30 days';
