// notification.module.ts
import { Global, Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './notification.repository';
import { NodemailerModule } from 'src/NodemailerConfig/Nodemailer.module';
import { NotificationEmailService } from './notificationEmail.service';

@Global()
@Module({
  imports: [NodemailerModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationRepository,
    NotificationEmailService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
