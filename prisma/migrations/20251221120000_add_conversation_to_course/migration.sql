-- AlterTable
ALTER TABLE "courses" ADD COLUMN "conversation_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "courses_conversation_id_key" ON "courses"("conversation_id");

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

