// organization.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { InviteRole } from 'src/mail/templates/inviteMember.template';
import { InviteStatus } from 'generated/prisma/enums';
import { UserInfoResponseDTO } from '../usersModule/user.dto';

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

export class SendInviteEmailDTO {
  @ApiProperty({
    example: 'invitee@example.com',
    description: 'The email address receiving the invitation',
  })
  @IsEmail({}, { message: 'Please provide a valid recipient email address.' })
  @IsNotEmpty({ message: 'Recipient email is required.' })
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  recipientEmail!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the person sending the invitation',
  })
  @ApiProperty({
    example: 'STAFF',
    enum: ['MANAGER', 'STAFF'],
    description: 'The role assigned to the invited user',
  })
  @IsEnum(['MANAGER', 'STAFF'], {
    message: 'Role must be either MANAGER or STAFF.',
  })
  @IsNotEmpty({ message: 'Invite role is required.' })
  role!: InviteRole;
}

export class ValidateInviteResponseDTO {
  @ApiProperty({
    example: 'invitee@example.com',
    description: 'The email address of the person who was invited',
  })
  email!: string;

  @ApiProperty({
    example: 'Shelvy Corp',
    description:
      'The name of the organization the user is being invited to join',
  })
  organizationName!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the person who sent the invitation',
  })
  inviterName!: string;

  @ApiProperty({
    example: 'STAFF',
    enum: ['MANAGER', 'STAFF'],
    description:
      'The organization role level attached to this invitation space',
  })
  role!: InviteRole;

  @ApiProperty({
    example: false,
    description:
      'Flag indicating if an active user profile already exists with this email address on the platform',
  })
  isExistingUser!: boolean;
  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'ACCEPTED', 'REVOKED'], // Explicitly matches your Prisma InviteStatus enum options
    description: 'The current lifecycle status of the invitation record',
  })
  status!: InviteStatus;
}

export class OrgMemberResponseDto {
  @ApiProperty({ example: 'cmu29xace00004oqmwev0i4m8' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'philippremium@shelvy.com' })
  @Expose()
  email!: string;

  @ApiProperty({ example: '2026-09-15T06:11:22.142Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ example: 'OWNER' })
  @Expose()
  role!: string;

  @ApiProperty({ type: UserInfoResponseDTO, isArray: true })
  @Expose()
  @Type(() => UserInfoResponseDTO)
  usersInfo!: UserInfoResponseDTO[];
}

export class OrgInviteResponseDto {
  @ApiProperty({ example: 'inv_abc123' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'invitee@domain.com' })
  @Expose()
  email!: string;

  @ApiProperty({ example: 'org_98765' })
  @Expose()
  organizationId!: string;

  @ApiProperty({ enum: ['MANAGER', 'STAFF'], example: 'STAFF' })
  @Expose()
  role!: string;

  @ApiProperty({ example: 'crypto_secure_token_string' })
  @Expose()
  token!: string;

  @ApiProperty({ example: 'u_admin_id' })
  @Expose()
  invitedById!: string;

  @ApiProperty({ example: '2026-10-13T09:21:00.000Z' })
  @Expose()
  expiresAt!: Date;

  @ApiProperty({ example: null, nullable: true })
  @Expose()
  acceptedAt!: Date | null;

  @ApiProperty({ example: '2026-10-06T09:21:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'],
    example: 'PENDING',
  }) // Match your InviteStatus enum
  @Expose()
  status!: string;
}
