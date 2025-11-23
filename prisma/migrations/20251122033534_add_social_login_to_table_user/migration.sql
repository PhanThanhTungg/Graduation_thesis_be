/*
  Warnings:

  - A unique constraint covering the columns `[facebook_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_id]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "user" ADD COLUMN     "google_id" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_facebook_id_key" ON "user"("facebook_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_google_id_key" ON "user"("google_id");
