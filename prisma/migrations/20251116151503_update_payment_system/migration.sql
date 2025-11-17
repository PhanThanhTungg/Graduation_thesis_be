-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('deposit', 'withdrawal');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'processing', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('paypal');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('processing', 'success', 'cancelled');

-- CreateEnum
CREATE TYPE "PlatformTransactionType" AS ENUM ('commission_income', 'upload_fee_income', 'ai_fee_income');

-- CreateTable
CREATE TABLE "wallet" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_deposited" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_withdrawn" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_earned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_spent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_before" DOUBLE PRECISION NOT NULL,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "description" TEXT,
    "reference_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "bank_name" VARCHAR(100),
    "bank_account" VARCHAR(50),
    "bank_account_name" VARCHAR(100),
    "note" TEXT,
    "rejection_reason" TEXT,
    "processed_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "withdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "final_price" DOUBLE PRECISION NOT NULL,
    "voucher_id" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'processing',
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_fee" (
    "id" TEXT NOT NULL,
    "upload_lesson_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ai_feature_base_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "platform_commission" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "min_withdrawal_amount" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "system_fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_wallet" (
    "id" TEXT NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "platform_wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_transaction" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "PlatformTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balance_before" DOUBLE PRECISION NOT NULL,
    "balance_after" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "performed_by" TEXT,
    "user_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_user_id_key" ON "wallet"("user_id");

-- CreateIndex
CREATE INDEX "transaction_wallet_id_idx" ON "transaction"("wallet_id");

-- CreateIndex
CREATE INDEX "transaction_type_idx" ON "transaction"("type");

-- CreateIndex
CREATE INDEX "transaction_status_idx" ON "transaction"("status");

-- CreateIndex
CREATE INDEX "withdrawal_wallet_id_idx" ON "withdrawal"("wallet_id");

-- CreateIndex
CREATE INDEX "withdrawal_status_idx" ON "withdrawal"("status");

-- CreateIndex
CREATE INDEX "order_user_id_idx" ON "order"("user_id");

-- CreateIndex
CREATE INDEX "order_course_id_idx" ON "order"("course_id");

-- CreateIndex
CREATE INDEX "order_status_idx" ON "order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "order_user_id_course_id_key" ON "order"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "platform_transaction_wallet_id_idx" ON "platform_transaction"("wallet_id");

-- CreateIndex
CREATE INDEX "platform_transaction_type_idx" ON "platform_transaction"("type");

-- CreateIndex
CREATE INDEX "platform_transaction_user_id_idx" ON "platform_transaction"("user_id");

-- CreateIndex
CREATE INDEX "platform_transaction_created_at_idx" ON "platform_transaction"("created_at");

-- AddForeignKey
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal" ADD CONSTRAINT "withdrawal_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "voucher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_transaction" ADD CONSTRAINT "platform_transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_transaction" ADD CONSTRAINT "platform_transaction_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "platform_wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
