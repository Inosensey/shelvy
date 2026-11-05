import { Expose, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MovementType } from 'generated/prisma/enums';
import { emptyToNull } from '../supplierModule/supplier.dto';
import { ApiProperty } from '@nestjs/swagger';
// import emptyToNull from where you defined it

export class RecordMovementDTO {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsIn([MovementType.IN, MovementType.OUT, MovementType.ADJUSTMENT])
  type!: MovementType;

  @Type(() => Number)
  @IsInt()
  @Min(-1_000_000)
  @Max(1_000_000)
  quantity!: number;

  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(200)
  reason?: string | null;

  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}

export class MovementQueryDTO {
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsIn(Object.values(MovementType)) type?: MovementType;
  @IsOptional() @IsISO8601() from?: string; // YYYY-MM-DD
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize: number =
    10;
}

export class StockMovementResponseDTO {
  @ApiProperty({ example: 'mov_cmu29xace00006' })
  @Expose()
  id!: string;

  @ApiProperty({ enum: MovementType, example: 'IN' })
  @Expose()
  type!: MovementType;

  @ApiProperty({
    example: 10,
    description: 'Signed value: positive adds inventory, negative deducts it',
  })
  @Expose()
  delta!: number;

  @ApiProperty({
    example: 52,
    description:
      'The absolute total stock balance snapshot immediately after this action log',
  })
  @Expose()
  stockAfter!: number;

  @ApiProperty({ example: 'Restock from supplier order #402', nullable: true })
  @Expose()
  reason!: string | null;

  @ApiProperty({ example: 'Batch #B24 box was pristine', nullable: true })
  @Expose()
  note!: string | null;

  @ApiProperty({ example: 'org_cmu29xace00001' })
  @Expose()
  organizationId!: string;

  @ApiProperty({ example: 'prod_cmu29xace00005' })
  @Expose()
  productId!: string;

  @ApiProperty({
    example: 'usr_cmu29xace00002',
    description: 'The user account ID who executed this transaction',
  })
  @Expose()
  performedById!: string;

  @ApiProperty({ example: '2026-10-28T16:30:00.000Z' })
  @Expose()
  createdAt!: Date;
}
