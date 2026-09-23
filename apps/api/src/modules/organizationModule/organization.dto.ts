// organization.dto.ts
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrganizationDTO {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty({ message: 'Organization name is required.' })
  @MaxLength(100, {
    message: 'Organization name cannot exceed 100 characters.',
  })
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiPropertyOptional({ example: 'A company that sells stuff' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Description cannot exceed 255 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  description?: string;
}

export class OrganizationResponseDTO {
  @ApiProperty({ example: 'cuid_1234567890' })
  id!: string;

  @ApiProperty({ example: 'Acme Corp' })
  name!: string;

  @ApiPropertyOptional({ example: 'A company that sells stuff' })
  description!: string | null;

  @ApiProperty({ example: '2026-09-09T12:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-09T12:00:00.000Z' })
  updatedAt!: Date;
}
