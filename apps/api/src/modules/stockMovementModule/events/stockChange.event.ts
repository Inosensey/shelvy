import { IEvent } from '@nestjs/cqrs';

export class StockChangedEvent implements IEvent {
  constructor(
    public readonly organizationId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly previousStock: number,
    public readonly newStock: number,
    public readonly lowStockThreshold: number,
    public readonly performedById: string,
  ) {}
}
