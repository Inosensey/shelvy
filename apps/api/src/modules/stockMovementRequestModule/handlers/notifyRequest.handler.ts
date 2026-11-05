import { NotificationService } from 'src/modules/notificationModule/notification.service';
import { StockMovementDecidedEvent } from '../events/stockMovementRequest.event';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { NotificationType } from 'generated/prisma/enums';
import { Logger } from '@nestjs/common';

@EventsHandler(StockMovementDecidedEvent)
export class NotifyRequesterHandler implements IEventHandler<StockMovementDecidedEvent> {
  private readonly logger = new Logger(NotifyRequesterHandler.name);
  constructor(private readonly notifications: NotificationService) {}

  async handle(e: StockMovementDecidedEvent) {
    const emitTo = 'user';
    try {
      await this.notifications.createAndEmit(
        {
          userId: e.requesterId,
          type: NotificationType.MOVEMENT_DECIDED,
          title: e.approved ? 'Request approved' : 'Request rejected',
          message: `Your stock request for ${e.productName} was ${e.approved ? 'approved' : 'rejected'}.${e.decisionNote ? ` Note: ${e.decisionNote}` : ''}`,
          organizationId: e.organizationId,
          metadata: {
            requestId: e.requestId,
            status: e.approved ? 'APPROVED' : 'REJECTED',
          },
        },
        emitTo,
      );
    } catch (err) {
      this.logger.error(
        `Decision notification failed: ${err instanceof Error ? err.message : err}`,
      );
    }
  }
}
