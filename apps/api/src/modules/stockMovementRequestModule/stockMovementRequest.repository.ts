import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { Role } from 'generated/prisma/enums';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import {
  DecisionDTO,
  RequestQueryDTO,
  CreateMovementRequestDTO,
} from './stockMovementRequest.dto';
import { StockMovementService } from '../stockMovementModule/stockMovement.service';
import { RecordMovementDTO } from '../stockMovementModule/stockMovement.dto';

const include = {
  product: { select: { id: true, name: true, stock: true } },
  requestedBy: { select: { id: true, email: true } },
  decidedBy: { select: { id: true, email: true } },
} satisfies Prisma.StockMovementRequestInclude;

@Injectable()
export class StockMovementRequestRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockMovementService: StockMovementService,
  ) {}

  async list(
    organizationId: string,
    userId: string,
    role: Role,
    query: RequestQueryDTO,
  ) {
    const where: Prisma.StockMovementRequestWhereInput = {
      organizationId,
      ...(role === Role.STAFF && { requestedById: userId }), // staff only see their own
      ...(query.status && { status: query.status }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovementRequest.findMany({
        where,
        include,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], // PENDING first (enum order)
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.stockMovementRequest.count({ where }),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async create(
    organizationId: string,
    userId: string,
    email: string,
    dto: CreateMovementRequestDTO,
  ) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, organizationId },
      select: { name: true, archivedAt: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    if (product.archivedAt)
      throw new BadRequestException('This product is archived.');

    const request = await this.prisma.stockMovementRequest.create({
      data: {
        type: dto.type,
        quantity: dto.quantity,
        reason: dto.reason,
        note: dto.note,
        organizationId,
        productId: dto.productId,
        requestedById: userId,
      },
      include,
    });

    // this.eventBus.publish(
    //   new StockMovementRequestedEvent(
    //     organizationId,
    //     request.id,
    //     product.name,
    //     userId,
    //     email,
    //   ),
    // );
    return { request, product };
  }

  async approve(
    id: string,
    organizationId: string,
    deciderId: string,
    dto: DecisionDTO,
  ) {
    const { request, applied } = await this.prisma.$transaction(async (tx) => {
      // Claim: only one approver wins, and only while PENDING.
      const claimed = await tx.stockMovementRequest.updateMany({
        where: { id, organizationId, status: 'PENDING' },
        data: {
          status: 'APPROVED',
          decidedById: deciderId,
          decidedAt: new Date(),
          decisionNote: dto.decisionNote ?? null,
        },
      });
      if (claimed.count === 0)
        throw new ConflictException(
          'This request was already handled or does not exist.',
        );

      const req = await tx.stockMovementRequest.findUniqueOrThrow({
        where: { id },
      });

      console.log('req', req);

      const stockMovementPayload: RecordMovementDTO = {
        productId: req.productId,
        quantity: req.quantity,
        type: req.type,
        note: req.note,
        reason: req.reason,
      };

      const applied = await this.stockMovementService.recordStockMovement(
        organizationId,
        req.requestedById,
        stockMovementPayload,
      );

      const request = await tx.stockMovementRequest.update({
        where: { id },
        data: { movementId: applied.movement.id },
        include,
      });
      return { request, applied };
    });
    return { request, applied };
  }

  async reject(
    id: string,
    organizationId: string,
    deciderId: string,
    dto: DecisionDTO,
  ) {
    const { count } = await this.prisma.stockMovementRequest.updateMany({
      where: { id, organizationId, status: 'PENDING' },
      data: {
        status: 'REJECTED',
        decidedById: deciderId,
        decidedAt: new Date(),
        decisionNote: dto.decisionNote ?? null,
      },
    });
    if (count === 0)
      throw new ConflictException(
        'This request was already handled or does not exist.',
      );

    const request = await this.prisma.stockMovementRequest.findUniqueOrThrow({
      where: { id },
      include,
    });
    return { request };
  }

  async cancel(id: string, organizationId: string, userId: string) {
    const { count } = await this.prisma.stockMovementRequest.updateMany({
      where: { id, organizationId, requestedById: userId, status: 'PENDING' }, // own + pending only
      data: { status: 'CANCELLED', decidedAt: new Date() },
    });
    if (count === 0)
      throw new ConflictException(
        'Only your own pending requests can be cancelled.',
      );
    return 'Request cancelled.';
  }
}
