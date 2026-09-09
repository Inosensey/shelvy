// dto/user.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  OmitType,
} from '@nestjs/swagger';

// ============================================
// REGISTER DTO
// ============================================

export class RegisterDTO {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required.' })
  @Transform(({ value }: { value: string }) => value?.trim())
  name!: string;

  @ApiProperty({ example: 'John@example.com', description: 'Email address' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd',
    description: 'Password (8-20 chars)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(20, { message: 'Password cannot exceed 20 characters.' })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password is too weak. It must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.',
    },
  )
  password!: string;
}

// ============================================
// UPDATE USER DTO (all fields optional)
// ============================================

export class UpdateUserDTO extends PartialType(
  OmitType(RegisterDTO, ['password'] as const),
) {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: string }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ example: 'John_updated@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email?: string;
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
