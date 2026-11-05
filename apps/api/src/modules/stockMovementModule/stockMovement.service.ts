import { BadRequestException, Injectable } from '@nestjs/common';
import { MovementQueryDTO, RecordMovementDTO } from './stockMovement.dto';
import { StockMovementRepository } from './stockMovement.repository';
import { EventBus } from '@nestjs/cqrs';
import { StockChangedEvent } from './events/stockChange.event';
import { toDelta } from 'src/utils/stockMovement';
import {
  CSV_BOM,
  csvCell,
  csvRow,
  manilaDateTime,
  MAX_EXPORT_ROWS,
} from 'src/utils/csv.util';

@Injectable()
export class StockMovementService {
  constructor(
    private readonly stockMovementRepo: StockMovementRepository,
    private readonly eventBus: EventBus,
  ) {}
  async assertExportable(orgId: string, q: MovementQueryDTO) {
    const total = await this.stockMovementRepo.countForExport(orgId, q);
    if (total > MAX_EXPORT_ROWS) {
      throw new BadRequestException(
        `Too many movements to export (${total}). Narrow your filters first.`,
      );
    }
  }

  async getStockMovements(
    organizationId: string,
    queryParams: MovementQueryDTO,
  ) {
    const { items, total, page, pageSize } = await this.stockMovementRepo.list(
      organizationId,
      queryParams,
    );
    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async recordStockMovement(
    organizationId: string,
    userId: string,
    dto: RecordMovementDTO,
  ) {
    const delta = toDelta(dto);

    const { movement, previousStock, product } =
      await this.stockMovementRepo.record(organizationId, userId, dto, delta);

    (
      this.eventBus as unknown as {
        publish(event: StockChangedEvent): void;
      }
    ).publish(
      new StockChangedEvent(
        organizationId,
        product.id,
        product.name,
        previousStock,
        product.stock,
        product.lowStockThreshold,
        userId,
      ),
    );

    return { movement, previousStock, product };
  }
  async getPageOf(organizationId: string, id: string, pageSize: number) {
    return {
      page: await this.stockMovementRepo.pageOf(organizationId, id, pageSize),
    };
  }

  async *exportCsv(orgId: string, q: MovementQueryDTO): AsyncGenerator<string> {
    yield CSV_BOM +
      csvRow([
        'Date',
        'Product',
        'SKU',
        'Type',
        'Change',
        'Stock after',
        'Reason',
        'Note',
        'Performed by',
      ]);
    for await (const batch of this.stockMovementRepo.iterateForExport(
      orgId,
      q,
    )) {
      for (const m of batch) {
        yield csvRow([
          csvCell(manilaDateTime(m.createdAt)),
          csvCell(m.product.name, { text: true }),
          csvCell(m.product.sku, { text: true }),
          csvCell(m.type),
          csvCell(m.delta), // numeric, so "-5" stays a number
          csvCell(m.stockAfter),
          csvCell(m.reason, { text: true }),
          csvCell(m.note, { text: true }),
          csvCell(m.performedBy.email, { text: true }),
        ]);
      }
    }
  }
}
