import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { NotificationType, Role } from 'generated/prisma/enums';
import { NotificationService } from 'src/modules/notificationModule/notification.service';
import { StockChangedEvent } from 'src/modules/stockMovementModule/events/stockChange.event';
import { PrismaService } from 'src/PrismaConfig/prisma.service';

@EventsHandler(StockChangedEvent)
export class LowStockHandler implements IEventHandler<StockChangedEvent> {
  private readonly logger = new Logger(LowStockHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  async handle(e: StockChangedEvent) {
    const wentOut = e.previousStock > 0 && e.newStock === 0;
    const crossedLow =
      e.previousStock > e.lowStockThreshold &&
      e.newStock <= e.lowStockThreshold;
    if (!wentOut && !crossedLow) return; // already low and still low: no spam

    try {
      const emitTo = 'org manager and owner';
      const recipients = await this.prisma.user.findMany({
        where: {
          organizationId: e.organizationId,
          role: { in: [Role.OWNER, Role.MANAGER] },
        },
        select: { id: true },
      });

      const message =
        e.newStock === 0
          ? `${e.productName} is out of stock.`
          : `${e.productName} is running low (${e.newStock} left).`;

      for (const recipient of recipients) {
        await this.notifications.createAndEmit(
          {
            userId: recipient.id,
            type: NotificationType.LOW_STOCK,
            title: e.newStock === 0 ? 'Out of stock' : 'Low stock',
            message,
            organizationId: e.organizationId,
            metadata: {
              productId: e.productId,
              productName: e.productName,
            },
          },
          emitTo,
        );
      }
    } catch (err) {
      this.logger.error(
        `Low-stock notification failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
