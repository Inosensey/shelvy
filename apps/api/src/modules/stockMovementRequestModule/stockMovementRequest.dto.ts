import { Expose, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MovementType, RequestStatus } from 'generated/prisma/enums';
import { emptyToNull } from '../supplierModule/supplier.dto';
import { ApiProperty } from '@nestjs/swagger';

// A request has the same fields as recording a movement directly
export { RecordMovementDTO as CreateMovementRequestDTO } from '../stockMovementModule/stockMovement.dto';

export class DecisionDTO {
  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(500)
  decisionNote?: string | null;
}

export class RequestQueryDTO {
  @IsOptional()
  @IsIn(Object.values(RequestStatus as Record<string, string>))
  status?: RequestStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize: number =
    10;
}

export class StockMovementRequestResponseDTO {
  @ApiProperty({ example: 'req_cmu29xace00007' })
  @Expose()
  id!: string;

  @ApiProperty({ enum: MovementType, example: 'OUT' })
  @Expose()
  type!: MovementType;

  @ApiProperty({
    example: 15,
    description: 'The absolute quantity of items requested for movement',
  })
  @Expose()
  quantity!: number;

  @ApiProperty({ example: 'Damaged item disposal request', nullable: true })
  @Expose()
  reason!: string | null;

  @ApiProperty({ example: 'Found 15 dented boxes in aisle 4', nullable: true })
  @Expose()
  note!: string | null;

  @ApiProperty({ enum: RequestStatus, example: 'PENDING' })
  @Expose()
  status!: RequestStatus;

  @ApiProperty({
    example: 'Approved, stock reduction verified',
    nullable: true,
  })
  @Expose()
  decisionNote!: string | null;

  @ApiProperty({ example: '2026-10-29T16:00:00.000Z', nullable: true })
  @Expose()
  decidedAt!: Date | null;

  @ApiProperty({ example: 'org_cmu29xace00001' })
  @Expose()
  organizationId!: string;

  @ApiProperty({ example: 'prod_cmu29xace00005' })
  @Expose()
  productId!: string;

  @ApiProperty({
    example: 'usr_cmu29xace00002',
    description: 'The user who submitted the request',
  })
  @Expose()
  requestedById!: string;

  @ApiProperty({
    example: 'usr_cmu29xace00001',
    nullable: true,
    description: 'The administrator who approved/rejected the request',
  })
  @Expose()
  decidedById!: string | null;

  @ApiProperty({
    example: 'mov_cmu29xace00006',
    nullable: true,
    description: 'The generated ledger ID if the request was approved',
  })
  @Expose()
  movementId!: string | null;

  @ApiProperty({ example: '2026-10-29T15:43:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-29T15:43:00.000Z' })
  @Expose()
  updatedAt!: Date;
}
