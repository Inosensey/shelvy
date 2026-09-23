// dto/user.dto.ts
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  MaxLength,
  IsDateString,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrganizationDTO } from '../organizationModule/organization.dto';

// ============================================
// CreateUserInfoDTO (what we receive from the client)
// ============================================
export class CreateUserInfoDTO {
  @ApiProperty({
    example: 'John',
    description: 'First name',
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required.' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters.' })
  @Transform(({ value }: { value: string }) => value?.trim())
  firstName!: string;

  @ApiPropertyOptional({
    example: 'Michael',
    description: 'Middle name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Middle name cannot exceed 100 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  middleName?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required.' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters.' })
  @Transform(({ value }: { value: string }) => value?.trim())
  lastName!: string;

  @ApiPropertyOptional({
    example: 'Jr.',
    description: 'Name suffix',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Suffix cannot exceed 20 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  suffix?: string;

  @ApiPropertyOptional({
    example: '1995-05-15',
    description: 'Birth date',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Please provide a valid birth date.' })
  birthDate?: string;

  @ApiPropertyOptional({
    example: 'Male',
    description: 'Gender',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Gender cannot exceed 50 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  gender?: string;

  @ApiPropertyOptional({
    example: '+639171234567',
    description: 'Phone number',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'Phone number cannot exceed 30 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  phone?: string;

  @ApiPropertyOptional({
    example: '123 Main Street',
    description: 'Street address',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Address cannot exceed 255 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  address?: string;

  @ApiPropertyOptional({
    example: 'Surigao City',
    description: 'City',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'City cannot exceed 100 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  city?: string;

  @ApiPropertyOptional({
    example: 'Surigao del Norte',
    description: 'State or province',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'State cannot exceed 100 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  state?: string;

  @ApiPropertyOptional({
    example: 'Philippines',
    description: 'Country',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Country cannot exceed 100 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  country?: string;

  @ApiPropertyOptional({
    example: '8400',
    description: 'Postal or ZIP code',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Postal code cannot exceed 20 characters.' })
  @Transform(({ value }: { value?: string }) => value?.trim())
  postalCode?: string;
}

// ============================================
// UserInfoResponseDTO (what we return to the client)
// ============================================
export class UserInfoResponseDTO {
  @ApiProperty({
    example: 1,
    description: 'User information ID',
  })
  id!: number;

  @ApiProperty({
    example: 'usr_1234567890',
    description: 'ID of the associated user',
  })
  userId!: string;

  @ApiProperty({
    example: 'John',
    description: 'First name',
  })
  firstName!: string;

  @ApiPropertyOptional({
    example: 'Michael',
    description: 'Middle name',
  })
  middleName!: string | null;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name',
  })
  lastName!: string;

  @ApiPropertyOptional({
    example: 'Jr.',
    description: 'Name suffix',
  })
  suffix!: string | null;

  @ApiPropertyOptional({
    example: '1995-05-15T00:00:00.000Z',
    description: 'Birth date',
  })
  birthDate!: Date | null;

  @ApiPropertyOptional({
    example: 'Male',
    description: 'Gender',
  })
  gender!: string | null;

  @ApiPropertyOptional({
    example: '+639171234567',
    description: 'Phone number',
  })
  phone!: string | null;

  @ApiPropertyOptional({
    example: '123 Main Street',
    description: 'Street address',
  })
  address!: string | null;

  @ApiPropertyOptional({
    example: 'Surigao City',
    description: 'City',
  })
  city!: string | null;

  @ApiPropertyOptional({
    example: 'Surigao del Norte',
    description: 'State or province',
  })
  state!: string | null;

  @ApiPropertyOptional({
    example: 'Philippines',
    description: 'Country',
  })
  country!: string | null;

  @ApiPropertyOptional({
    example: '8400',
    description: 'Postal or ZIP code',
  })
  postalCode!: string | null;

  @ApiProperty({
    example: '2026-09-09T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-09-09T12:00:00.000Z',
  })
  updatedAt!: Date;
}

// ============================================
// Create OnboardingInfoDTO (what we receive from the client)
// ============================================
export class SaveOnboardingDTO {
  @ApiProperty({
    type: CreateUserInfoDTO,
  })
  @ValidateNested()
  @Type(() => CreateUserInfoDTO)
  userInfo!: CreateUserInfoDTO;

  @ApiProperty({
    type: CreateOrganizationDTO,
  })
  @ValidateNested()
  @Type(() => CreateOrganizationDTO)
  organization!: CreateOrganizationDTO;
}

// ============================================
// RESPONSE DTO (what we return to the client)
// ============================================

export class UserResponseDTO {
  @ApiProperty({ example: 'usr_1234567890' })
  id!: string;

  @ApiProperty({ example: 'John@example.com' })
  email!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt!: Date | null;
}
