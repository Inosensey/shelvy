import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Role } from 'generated/prisma/enums';
import { toDelta } from 'src/utils/stockMovement';
import {
  StockMovementDecidedEvent,
  StockMovementRequestedEvent,
} from './events/stockMovementRequest.event';
import {
  DecisionDTO,
  RequestQueryDTO,
  CreateMovementRequestDTO,
} from './stockMovementRequest.dto';
import { StockMovementRequestRepository } from './stockMovementRequest.repository';
import { UserService } from '../usersModule/user.service';

@Injectable()
export class StockMovementRequestService {
  constructor(
    private readonly stockMovementRequestRepo: StockMovementRequestRepository,
    private readonly userService: UserService,
    private readonly eventBus: EventBus,
  ) {}

  async getStockMovementRequests(
    organizationId: string,
    userId: string,
    role: Role,
    query: RequestQueryDTO,
  ) {
    const response = await this.stockMovementRequestRepo.list(
      organizationId,
      userId,
      role,
      query,
    );

    return response;
  }

  async createStockMovementRequest(
    organizationId: string,
    userId: string,
    dto: CreateMovementRequestDTO,
  ) {
    toDelta(dto);

    const requesterInfo = await this.userService.getUserById(userId);

    const { product, request } = await this.stockMovementRequestRepo.create(
      organizationId,
      userId,
      requesterInfo.email,
      dto,
    );

    this.eventBus.publish(
      new StockMovementRequestedEvent(
        organizationId,
        request.id,
        product.name,
        userId,
        requesterInfo.email,
      ),
    );
    return request;
  }

  async approveStockMovementRequest(
    id: string,
    organizationId: string,
    deciderId: string,
    dto: DecisionDTO,
  ) {
    const { request } = await this.stockMovementRequestRepo.approve(
      id,
      organizationId,
      deciderId,
      dto,
    );

    this.eventBus.publish(
      new StockMovementDecidedEvent(
        organizationId,
        id,
        request.product.name,
        request.requestedById,
        true,
        dto.decisionNote ?? null,
      ),
    );
    // this.eventBus.publish(
    //   new StockChangedEvent(
    //     organizationId,
    //     applied.product.id,
    //     applied.product.name,
    //     applied.previousStock,
    //     applied.product.stock,
    //     applied.product.lowStockThreshold,
    //     request.requestedById,
    //   ),
    // );
    return request;
  }

  async rejectStockMovementRequest(
    id: string,
    organizationId: string,
    deciderId: string,
    dto: DecisionDTO,
  ) {
    const { request } = await this.stockMovementRequestRepo.reject(
      id,
      organizationId,
      deciderId,
      dto,
    );
    this.eventBus.publish(
      new StockMovementDecidedEvent(
        organizationId,
        id,
        request.product.name,
        request.requestedById,
        false,
        dto.decisionNote ?? null,
      ),
    );
    return request;
  }

  async cancelStockMovementRequest(
    id: string,
    organizationId: string,
    userId: string,
  ) {
    await this.stockMovementRequestRepo.cancel(id, organizationId, userId);
    return 'Request cancelled.';
  }
}
