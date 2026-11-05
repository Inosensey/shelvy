// users.module.ts
import { CqrsModule } from '@nestjs/cqrs';
import { Module } from '@nestjs/common';
import { StockMovementController } from './stockMovement.controller';
import { StockMovementService } from './stockMovement.service';
import { StockMovementRepository } from './stockMovement.repository';
import { StockMovementHandlers } from './handlers/stockMovement.handlers';

@Module({
  imports: [CqrsModule.forRoot()],
  controllers: [StockMovementController],
  providers: [
    StockMovementService,
    StockMovementRepository,
    ...StockMovementHandlers,
  ],
  exports: [StockMovementService],
})
export class StockMovementModule {}
