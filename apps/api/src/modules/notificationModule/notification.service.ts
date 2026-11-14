// notification.service.ts
import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { NotificationGateway } from 'src/socketGateway/notification.gateway';
import { NotificationPayload } from 'src/types/notification';
import { Role } from 'generated/prisma/enums';
import { UpdateNotificationSettingDTO } from './notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // async createAndEmit(data: CreateNotificationDTO, to: string = 'org') {
  //   const notification = await this.notificationRepo.create(data);

  //   switch (to) {
  //     case 'org':
  //       this.notificationGateway.emitToOrg(
  //         data.organizationId,
  //         data.type ? data.type : 'notification',
  //         {
  //           ...notification,
  //         },
  //       );
  //       break;
  //     case 'user':
  //       this.notificationGateway.emitToUser(
  //         data.userId,
  //         data.type ? data.type : 'notification',
  //         {
  //           ...notification,
  //         },
  //       );
  //       break;
  //     case 'org manager and owner':
  //       this.notificationGateway.emitToOrgManagerOwner(
  //         data.organizationId,
  //         data.userId,
  //         data.type ? data.type : 'notification',
  //         {
  //           ...notification,
  //         },
  //       );
  //       break;

  //     default:
  //       this.notificationGateway.emitToOrg(
  //         data.organizationId,
  //         data.type ? data.type : 'notification',
  //         {
  //           ...notification,
  //         },
  //       );
  //       break;
  //   }

  //   return notification;
  // }

  async notify(userIds: string[], data: NotificationPayload) {
    const recipients = [...new Set(userIds)];
    if (recipients.length === 0) return [];

    const rows = await this.notificationRepo.createMany(
      recipients.map((userId) => ({ ...data, userId })),
    );
    for (const n of rows) {
      this.notificationGateway.emitToUser(n.userId, n.type, n);
    }
    return rows;
  }

  recipientIds(organizationId: string, roles: Role[]) {
    return this.notificationRepo.findUserIdsByRoles(organizationId, roles);
  }

  async managerAndOwnerIds(organizationId: string) {
    return this.notificationRepo.findManagerAndOwnerIds(organizationId);
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

  async markAllAsRead(userId: string) {
    return this.notificationRepo.markAllAsRead(userId);
  }

  getSettings(userId: string) {
    return this.notificationRepo.getSetting(userId);
  }
  updateSettings(userId: string, dto: UpdateNotificationSettingDTO) {
    return this.notificationRepo.upsertSetting(userId, dto);
  }
}
