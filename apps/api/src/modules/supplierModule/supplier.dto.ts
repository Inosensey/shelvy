import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Empty form fields arrive as "", store them as null
export const emptyToNull = () =>
  Transform(({ value }: { value: string }) =>
    typeof value === 'string' && value.trim() === '' ? null : value,
  );

export class CreateSupplierDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @emptyToNull()
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @emptyToNull()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;
}

export class UpdateSupplierDTO extends PartialType(CreateSupplierDTO) {}

export class SupplierQueryDTO {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 10;
}

export class SupplierResponseDTO {
  @ApiProperty({ example: 'sup_cmu29xace00004' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'Acme Logistics Inc.' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 'contact@acme.com', nullable: true })
  @Expose()
  email!: string | null;

  @ApiProperty({ example: '+639123456789', nullable: true })
  @Expose()
  phone!: string | null;

  @ApiProperty({ example: '123 Industrial Zone, Surigao City', nullable: true })
  @Expose()
  address!: string | null;

  @ApiProperty({ example: 'org_cmu29xace00001' })
  @Expose()
  organizationId!: string;

  @ApiProperty({ example: '2026-10-23T09:49:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ example: '2026-10-23T09:49:00.000Z' })
  @Expose()
  updatedAt!: Date;
}

export class SupplierOptionsResponseDTO {
  @ApiProperty({
    example: 'sup_cmu29xace00004',
    description: 'The supplier lookup ID',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    example: 'Acme Logistics Inc.',
    description: 'The supplier display name',
  })
  @Expose()
  name!: string;
}
