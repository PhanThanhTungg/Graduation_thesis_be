-- CreateTable
CREATE TABLE "StudentSetting" (
    "id" TEXT NOT NULL,
    "telegram_id" TEXT,
    "spr_interval" INTEGER DEFAULT 600,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_active_date" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "StudentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentSetting_telegram_id_key" ON "StudentSetting"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSetting_user_id_key" ON "StudentSetting"("user_id");

-- AddForeignKey
ALTER TABLE "StudentSetting" ADD CONSTRAINT "StudentSetting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
