import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';

export class createCheckoutDTO {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address',
  })
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
}

export class verifyPaymentDTO {
  // @IsString({ message: 'User ID must be a string' })
  // @Transform(({ value }) => String(value.trim()))
  // userId: string;

  // @IsString({ message: 'Purchase ID must be a string' })
  // @Transform(({ value }) => String(value.trim()))
  // purchaseId: string;

  // @IsString({ message: 'Payment ID must be a string' })
  // @Transform(({ value }) => String(value.trim()))
  // paymentId: string;

  @IsNotEmpty({ message: 'Session ID is required' })
  @IsString({ message: 'Session ID must be a string' })
  @Transform(({ value }: { value: string }) => String(value.trim()))
  sessionId!: string;
}
