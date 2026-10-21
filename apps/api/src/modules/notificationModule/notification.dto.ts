// notification-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { JsonValue } from '@prisma/client/runtime/client';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from 'generated/prisma/client';

export class NotificationResponseDTO {
  @ApiProperty({ example: 'not_cmu29xace00004' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'usr_1234567890' })
  @Expose()
  userId!: string;

  @ApiProperty({ example: 'org_9876543210' })
  @Expose()
  organizationId!: string;

  @ApiProperty({
    enum: NotificationType,
    example: 'MEMBER_JOINED',
  })
  @Expose()
  type!: NotificationType;

  @ApiProperty({ example: 'New Team Member' })
  @Expose()
  title!: string;

  @ApiProperty({ example: 'Philip has joined your organization!' })
  @Expose()
  message!: string;

  @ApiProperty({ example: false })
  @Expose()
  isRead!: boolean;

  @ApiProperty({ example: '2026-10-14T11:31:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    example: { inviteId: 'inv_abc123', actorId: 'usr_admin' },
    nullable: true,
    description:
      'Dynamic JSON payload storage matching specific event metadata',
  })
  @Expose()
  metadata!: Record<string, any> | null;
}

export class CreateNotificationDTO {
  @ApiProperty({
    example: 'org_9876543210',
    description: 'The target organization ID context',
  })
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({
    example: 'usr_1234567890',
    description: 'The user ID receiving this notification',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({
    enum: NotificationType,
    example: 'INFO',
    description:
      'The semantic type categorization grouping for this notification',
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @ApiProperty({ example: 'Invitation Accepted' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Philip has successfully joined your organization team directory.',
  })
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty({ example: false, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean = false;

  @ApiProperty({
    example: { inviteId: 'inv_abc123', actionBy: 'usr_philip' },
    required: false,
    nullable: true,
    description: 'Optional dynamic contextual metadata object layer payload',
  })
  @IsOptional()
  @IsObject()
  metadata?: JsonValue | null;
}
