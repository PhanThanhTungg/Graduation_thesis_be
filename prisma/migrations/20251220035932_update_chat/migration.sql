-- CreateEnum
CREATE TYPE "FriendStatus" AS ENUM ('pending', 'accepted', 'blocked');

-- CreateEnum
CREATE TYPE "ConversationMemberRole" AS ENUM ('admin', 'subadmin', 'member');

-- CreateTable
CREATE TABLE "conversation" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50),
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_member" (
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "ConversationMemberRole",
    "last_seen_message_id" TEXT,
    "last_seen_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_member_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message" TEXT,
    "file_url" TEXT,
    "file_name" TEXT,
    "file_size" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend" (
    "user_id" TEXT NOT NULL,
    "friend_id" TEXT NOT NULL,
    "status" "FriendStatus" NOT NULL DEFAULT 'pending',
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_pkey" PRIMARY KEY ("user_id","friend_id")
);

-- CreateIndex
CREATE INDEX "conversation_is_group_idx" ON "conversation"("is_group");

-- CreateIndex
CREATE INDEX "conversation_member_user_id_idx" ON "conversation_member"("user_id");

-- CreateIndex
CREATE INDEX "conversation_member_conversation_id_idx" ON "conversation_member"("conversation_id");

-- CreateIndex
CREATE INDEX "message_conversation_id_idx" ON "message"("conversation_id");

-- CreateIndex
CREATE INDEX "message_sender_id_idx" ON "message"("sender_id");

-- CreateIndex
CREATE INDEX "message_created_at_idx" ON "message"("created_at");

-- CreateIndex
CREATE INDEX "friend_user_id_idx" ON "friend"("user_id");

-- CreateIndex
CREATE INDEX "friend_friend_id_idx" ON "friend"("friend_id");

-- CreateIndex
CREATE INDEX "friend_status_idx" ON "friend"("status");

-- AddForeignKey
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_member" ADD CONSTRAINT "conversation_member_last_seen_message_id_fkey" FOREIGN KEY ("last_seen_message_id") REFERENCES "message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend" ADD CONSTRAINT "friend_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend" ADD CONSTRAINT "friend_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
