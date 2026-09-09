// dto/auth.dto.ts
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsStrongPassword,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDTO } from 'src/modules/usersModule/user.dto';
import { SubscriptionPlan } from 'generated/prisma/client';

// ============================================
// REGISTER DTO
// ============================================

// register.dto.ts
export class RegisterDTO {
  @ApiProperty({ example: 'John@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
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
    { message: 'Password is too weak.' },
  )
  password!: string;

  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.PREMIUM })
  @IsEnum(SubscriptionPlan, { message: 'Invalid plan selected.' })
  @IsNotEmpty({ message: 'Plan is required.' })
  plan?: SubscriptionPlan;
}

// ============================================
// LOGIN DTO
// ============================================

export class LoginDTO {
  @ApiProperty({ example: 'John@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @Transform(({ value }: { value: string }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ example: 'StrongP@ssw0rd' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password!: string;
}
// ============================================
// AUTH RESPONSE (login/register)
// ============================================

export class AuthResponseDTO {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ type: UserResponseDTO })
  user!: UserResponseDTO;
}
