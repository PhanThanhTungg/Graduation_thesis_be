/*
  Warnings:

  - A unique constraint covering the columns `[discord_id]` on the table `StudentSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AiModel" AS ENUM ('gemini', 'groq');

-- CreateEnum
CREATE TYPE "SprBot" AS ENUM ('telegram', 'discord', 'chrome_extension');

-- AlterTable
ALTER TABLE "StudentSetting" ADD COLUMN     "discord_id" TEXT,
ADD COLUMN     "spr_bot" "SprBot" NOT NULL DEFAULT 'telegram',
ADD COLUMN     "spr_model" "AiModel" NOT NULL DEFAULT 'groq';

-- CreateIndex
CREATE UNIQUE INDEX "StudentSetting_discord_id_key" ON "StudentSetting"("discord_id");
