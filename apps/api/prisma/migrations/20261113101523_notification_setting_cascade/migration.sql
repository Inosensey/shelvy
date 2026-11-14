-- DropForeignKey
ALTER TABLE "notification_settings" DROP CONSTRAINT "notification_settings_user_id_fkey";

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
