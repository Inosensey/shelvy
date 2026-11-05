import { Module } from '@nestjs/common';
import { StockMovementModule } from '../stockMovementModule/stockMovement.module';
import { MovementRequestController } from './stockMovementRequest.controller';
import { StockMovementRequestService } from './stockMovementRequest.service';
import { stockMovementRequestHandlers } from './handlers/stockMovementRequest.handlers';
import { UserModule } from '../usersModule/user.module';
import { StockMovementRequestRepository } from './stockMovementRequest.repository';
import { CqrsModule } from '@nestjs/cqrs';

@Module({
  imports: [CqrsModule.forRoot(), StockMovementModule, UserModule],
  controllers: [MovementRequestController],
  providers: [
    StockMovementRequestService,
    StockMovementRequestRepository,
    ...stockMovementRequestHandlers,
  ],
  exports: [StockMovementRequestService],
})
export class StockMovementRequestModule {}
