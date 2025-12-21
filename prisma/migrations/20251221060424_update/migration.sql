-- AlterTable
ALTER TABLE "user" ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "online_status" BOOLEAN NOT NULL DEFAULT false;
