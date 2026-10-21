// notification.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { NotificationType } from 'generated/prisma/client';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    organizationId: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return this.prisma.notification.create({ data });
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

  async markAllAsRead(organizationId: string) {
    return this.prisma.notification.updateMany({
      where: { organizationId, isRead: false },
      data: { isRead: true },
    });
  }
}
