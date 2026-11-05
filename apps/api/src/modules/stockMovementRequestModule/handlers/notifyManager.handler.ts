import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { StockMovementRequestedEvent } from '../events/stockMovementRequest.event';
import { NotificationService } from 'src/modules/notificationModule/notification.service';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { NotificationType, Role } from 'generated/prisma/enums';
import { Logger } from '@nestjs/common';

@EventsHandler(StockMovementRequestedEvent)
export class NotifyManagersHandler implements IEventHandler<StockMovementRequestedEvent> {
  private readonly logger = new Logger(NotifyManagersHandler.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async handle(e: StockMovementRequestedEvent) {
    try {
      const emitTo = 'org manager and owner';
      const recipients = await this.prisma.user.findMany({
        where: {
          organizationId: e.organizationId,
          role: { in: [Role.OWNER, Role.MANAGER] },
        },
        select: { id: true },
      });
      for (const recipient of recipients) {
        await this.notifications.createAndEmit(
          {
            userId: recipient.id,
            type: NotificationType.MOVEMENT_REQUESTED,
            title: 'Stock request',
            message: `${e.requesterEmail} requested a stock change for ${e.productName}.`,
            organizationId: e.organizationId,
            metadata: {
              requestId: e.requestId,
            },
          },
          emitTo,
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.logger.error(`Request notification failed: ${errorMessage}`);
    }
  }
}
