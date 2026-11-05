// notification.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationGateway } from 'src/socketGateway/notification.gateway';
import { CreateNotificationDTO } from './notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async createAndEmit(data: CreateNotificationDTO, to: string = 'org') {
    const notification = await this.notificationRepo.create(data);

    switch (to) {
      case 'org':
        this.notificationGateway.emitToOrg(
          data.organizationId,
          data.type ? data.type : 'notification',
          {
            ...notification,
          },
        );
        break;
      case 'user':
        this.notificationGateway.emitToUser(
          data.userId,
          data.type ? data.type : 'notification',
          {
            ...notification,
          },
        );
        break;
      case 'org manager and owner':
        this.notificationGateway.emitToOrgManagerOwner(
          data.organizationId,
          data.userId,
          data.type ? data.type : 'notification',
          {
            ...notification,
          },
        );
        break;

      default:
        this.notificationGateway.emitToOrg(
          data.organizationId,
          data.type ? data.type : 'notification',
          {
            ...notification,
          },
        );
        break;
    }

    return notification;
  }

  async getMyNotifications(userId: string) {
    return this.notificationRepo.findAllByUserId(userId);
  }

  async getUnreadCount(userId: string) {
    return this.notificationRepo.getUnreadCount(userId);
  }

  async markAsRead(id: string, userId: string) {
    return this.notificationRepo.markAsRead(id, userId);
  }

  async markAllAsRead(organizationId: string) {
    return this.notificationRepo.markAllAsRead(organizationId);
  }
}
