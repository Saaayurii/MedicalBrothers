-- AlterTable: Add email verification fields to patients table
ALTER TABLE "patients" ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN "email_verification_token" VARCHAR(255);
ALTER TABLE "patients" ADD COLUMN "email_verification_expiry" TIMESTAMP(6);

-- AlterTable: Add two-factor authentication fields to patients table
ALTER TABLE "patients" ADD COLUMN "two_factor_secret" VARCHAR(255);
ALTER TABLE "patients" ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "patients" ADD COLUMN "two_factor_backup_codes" TEXT;

-- AlterTable: Add two-factor authentication fields to admins table
ALTER TABLE "admins" ADD COLUMN "two_factor_secret" VARCHAR(255);
ALTER TABLE "admins" ADD COLUMN "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "admins" ADD COLUMN "two_factor_backup_codes" TEXT;

-- CreateTable: Push notification subscriptions
CREATE TABLE "push_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "user_type" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX "push_subscriptions_user_id_user_type_idx" ON "push_subscriptions"("user_id", "user_type");
CREATE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions"("endpoint");
CREATE INDEX "patients_email_verification_token_idx" ON "patients"("email_verification_token");
