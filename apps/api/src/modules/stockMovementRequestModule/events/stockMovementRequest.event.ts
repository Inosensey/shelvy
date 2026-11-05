import { IEvent } from '@nestjs/cqrs';

export class StockMovementRequestedEvent implements IEvent {
  constructor(
    public readonly organizationId: string,
    public readonly requestId: string,
    public readonly productName: string,
    public readonly requesterId: string,
    public readonly requesterEmail: string,
  ) {}
}

export class StockMovementDecidedEvent implements IEvent {
  constructor(
    public readonly organizationId: string,
    public readonly requestId: string,
    public readonly productName: string,
    public readonly requesterId: string,
    public readonly approved: boolean,
    public readonly decisionNote: string | null,
  ) {}
}
