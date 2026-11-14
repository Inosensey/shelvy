-- CreateEnum
CREATE TYPE "NotificationEmailMode" AS ENUM ('OFF', 'IF_UNREAD', 'IMMEDIATE');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "emailed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "notification_settings" (
    "user_id" TEXT NOT NULL,
    "email_mode" "NotificationEmailMode" NOT NULL DEFAULT 'IF_UNREAD',
    "email_low_stock" BOOLEAN NOT NULL DEFAULT true,
    "email_requests" BOOLEAN NOT NULL DEFAULT true,
    "email_decisions" BOOLEAN NOT NULL DEFAULT true,
    "email_members" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_is_read_emailed_at_created_at_idx" ON "notifications"("is_read", "emailed_at", "created_at");

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
