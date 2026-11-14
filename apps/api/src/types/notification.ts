import { NotificationType, Prisma } from 'generated/prisma/client';

export type NotificationPayload = {
  organizationId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
};
