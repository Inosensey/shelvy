import { PartialType, OmitType } from '@nestjs/mapped-types';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { emptyToNull } from '../supplierModule/supplier.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from 'generated/prisma/client';

const normalizeSku = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toUpperCase() || null : value;

export class ProductResponseDTO {
  @ApiProperty({ example: 'prod_cmu29xace00005' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Wireless Mechanical Keyboard' })
  @Expose()
  name!: string;

  @ApiProperty({
    example: 'Hot-swappable RGB mechanical keyboard with linear switches.',
    nullable: true,
  })
  @Expose()
  description!: string | null;

  @ApiProperty({
    example: 'TSH-BLK-M',
    nullable: true,
  })
  @Expose()
  sku!: string | null;

  @ApiProperty({
    example: 4999.5,
    description: 'Product price mapped cleanly to a number instance value',
  })
  @Expose()
  // Type the value union to cleanly support incoming database objects or fallback primitives
  @Transform(
    ({ value }: { value: Prisma.Decimal | number | string | undefined }) => {
      if (
        value &&
        typeof value === 'object' &&
        typeof value.toNumber === 'function'
      ) {
        return value.toNumber();
      }
      return value !== undefined ? Number(value) : undefined;
    },
  )
  price!: number;

  @ApiProperty({
    example: 42,
    description: 'Current calculated balance inventory cache level',
  })
  @Expose()
  stock!: number;

  @ApiProperty({
    example: 5,
    description: 'Minimum flag baseline to alert out-of-stock scenarios',
  })
  @Expose()
  lowStockThreshold!: number;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Soft delete retention logging point timestamp context',
  })
  @Expose()
  archivedAt!: Date | null;

  @ApiProperty({ example: 'org_cmu29xace00001' })
  @Expose()
  organizationId!: string;

  @ApiProperty({ example: 'sup_cmu29xace00004', nullable: true })
  @Expose()
  supplierId!: string | null;

  @ApiProperty({ example: '2026-10-23T16:33:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-23T16:33:00.000Z' })
  @Expose()
  updatedAt!: Date;
}

export class ProductOptionsResponseDTO {
  @ApiProperty({ example: 'prod_cmu29xace00005' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Wireless Mechanical Keyboard' })
  @Expose()
  name!: string;

  @ApiProperty({
    example: 42,
    description:
      'Included stock context to show availability in dropdown fields',
  })
  @Expose()
  stock!: number;
}

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @Transform(({ value }: { value: string }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @Transform(normalizeSku)
  @IsString()
  @MaxLength(40)
  @Matches(/^[A-Z0-9][A-Z0-9._\-/]*$/, {
    message: 'SKU may only contain letters, numbers, . _ - /',
  })
  sku?: string | null;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  price!: number;

  @IsOptional()
  @emptyToNull()
  @IsString()
  supplierId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  lowStockThreshold?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  initialStock?: number;
}

// stock is never editable here, only through movements
export class UpdateProductDTO extends PartialType(
  OmitType(CreateProductDTO, ['initialStock'] as const),
) {}

const toBool = ({ value }) => value === true || value === 'true';

export class ProductQueryDTO {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() supplierId?: string;
  @IsOptional() @Transform(toBool) @IsBoolean() lowStock?: boolean;
  @IsOptional() @Transform(toBool) @IsBoolean() archived?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize: number =
    10;
}

export class ProductStatsDTO {
  @ApiProperty({
    example: 120,
    description: 'Sum of all items added via IN stock movements',
  })
  @Expose()
  totalIn!: number;

  @ApiProperty({
    example: 78,
    description: 'Sum of all items deducted via OUT stock movements',
  })
  @Expose()
  totalOut!: number;

  @ApiProperty({
    example: 14,
    description: 'Total number of transactions logged for this product',
  })
  @Expose()
  movementCount!: number;
}

export class ProductTrendPointDTO {
  @ApiProperty({ example: '2026-10-24T08:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    example: 42,
    description: 'Stock level balance snapshot at this point in time',
  })
  @Expose()
  stockAfter!: number;
}

export class ProductDetailResponseDTO extends ProductResponseDTO {
  @ApiProperty({ type: ProductStatsDTO })
  @Expose()
  @Type(() => ProductStatsDTO)
  stats!: ProductStatsDTO;

  @ApiProperty({ type: ProductTrendPointDTO, isArray: true })
  @Expose()
  @Type(() => ProductTrendPointDTO)
  trend!: ProductTrendPointDTO[];
}
