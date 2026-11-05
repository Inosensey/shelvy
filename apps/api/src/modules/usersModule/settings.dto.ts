// users/settings.dto.ts
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { emptyToNull } from '../supplierModule/supplier.dto'; // or your shared util

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateProfileDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Transform(trim)
  firstName!: string;

  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(60)
  middleName?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Transform(trim)
  lastName!: string;

  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(10)
  suffix?: string | null;

  @IsOptional()
  @emptyToNull()
  @IsString()
  @MaxLength(30)
  @Matches(/^[0-9+()\-\s]+$/, {
    message: 'Phone may only contain digits, spaces, + ( ) -',
  })
  phone?: string | null;
}

export class ChangePasswordDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  currentPassword!: string;

  // 72 is bcrypt's limit; use the same rules as your RegisterDTO
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword!: string;
}
