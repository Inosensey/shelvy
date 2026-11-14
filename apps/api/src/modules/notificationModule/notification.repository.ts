// notification.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import {
  NotificationEmailMode,
  NotificationType,
  Role,
} from 'generated/prisma/client';
import { NotificationPayload } from 'src/types/notification';
import { UpdateNotificationSettingDTO } from './notification.dto';

const DEFAULT_SETTING = {
  emailMode: NotificationEmailMode.IF_UNREAD,
  emailLowStock: true,
  emailRequests: true,
  emailDecisions: true,
  emailMembers: true,
};
const settingSelect = {
  emailMode: true,
  emailLowStock: true,
  emailRequests: true,
  emailDecisions: true,
  emailMembers: true,
} as const;

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(rows: (NotificationPayload & { userId: string })[]) {
    return this.prisma.notification.createManyAndReturn({ data: rows });
  }

  async create(data: {
    userId: string;
    organizationId: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return this.prisma.notification.create({ data });
  }

  async findManagerAndOwnerIds(organizationId: string) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role: { in: [Role.OWNER, Role.MANAGER] } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  async findUserIdsByRoles(organizationId: string, roles: Role[]) {
    const users = await this.prisma.user.findMany({
      where: { organizationId, role: { in: roles } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  async findAllByUserId(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { isRead: false, userId },
      data: { isRead: true },
    });
  }

  async getSetting(userId: string) {
    const row = await this.prisma.notificationSetting.findUnique({
      where: { userId },
      select: settingSelect,
    });
    return row ?? DEFAULT_SETTING;
  }

  async upsertSetting(userId: string, data: UpdateNotificationSettingDTO) {
    return this.prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      select: settingSelect,
    });
  }
}
