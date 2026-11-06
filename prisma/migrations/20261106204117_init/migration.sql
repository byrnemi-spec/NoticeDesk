-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'staff');

-- CreateEnum
CREATE TYPE "NoticeStatus" AS ENUM ('New', 'Reviewed', 'Responded', 'Closed');

-- CreateEnum
CREATE TYPE "UploadedBy" AS ENUM ('staff', 'client_link');

-- CreateEnum
CREATE TYPE "DeadlineSource" AS ENUM ('printed', 'rule', 'manual');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "WindowType" AS ENUM ('calendar', 'business', 'printed');

-- CreateTable
CREATE TABLE "firms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "firms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'staff',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "tin_last4" VARCHAR(4),
    "upload_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "firm_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_by" "UploadedBy" NOT NULL DEFAULT 'staff',
    "notice_code" TEXT,
    "rule_code" TEXT,
    "tax_form" TEXT,
    "tax_years" INTEGER[],
    "notice_date" DATE,
    "printed_respond_by" DATE,
    "deadline" DATE,
    "deadline_source" "DeadlineSource",
    "is_hard_deadline" BOOLEAN NOT NULL DEFAULT false,
    "amount_due" DECIMAL(14,2),
    "summary" TEXT,
    "what_irs_wants" TEXT,
    "if_ignored" TEXT,
    "next_step" TEXT,
    "penalties_listed" TEXT[],
    "confidence" "Confidence",
    "raw_ai_json" JSONB,
    "needs_review" BOOLEAN NOT NULL DEFAULT true,
    "status" "NoticeStatus" NOT NULL DEFAULT 'New',
    "notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notice_rules" (
    "code" TEXT NOT NULL,
    "aliases" TEXT[],
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "window_days" INTEGER,
    "window_type" "WindowType" NOT NULL,
    "large_balance_threshold" DECIMAL(14,2),
    "large_balance_window_days" INTEGER,
    "is_hard" BOOLEAN NOT NULL,
    "default_next_step" TEXT NOT NULL,
    "irs_link" TEXT,

    CONSTRAINT "notice_rules_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_firm_id_idx" ON "users"("firm_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_upload_token_key" ON "clients"("upload_token");

-- CreateIndex
CREATE INDEX "clients_firm_id_idx" ON "clients"("firm_id");

-- CreateIndex
CREATE INDEX "notices_firm_id_deadline_idx" ON "notices"("firm_id", "deadline");

-- CreateIndex
CREATE INDEX "notices_firm_id_status_idx" ON "notices"("firm_id", "status");

-- CreateIndex
CREATE INDEX "notices_client_id_idx" ON "notices"("client_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_firm_id_fkey" FOREIGN KEY ("firm_id") REFERENCES "firms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_rule_code_fkey" FOREIGN KEY ("rule_code") REFERENCES "notice_rules"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
