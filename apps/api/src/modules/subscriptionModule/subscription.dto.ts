// subscription.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionResponseDTO {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  plan!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  stripeSubscriptionId?: string;

  @ApiProperty()
  stripeCustomerId?: string;

  @ApiProperty()
  stripePriceId?: string;

  @ApiProperty()
  currentPeriodStart?: Date;

  @ApiProperty()
  currentPeriodEnd?: Date;

  @ApiProperty()
  cancelAtPeriodEnd!: boolean;

  @ApiProperty()
  lastPaymentDate?: Date;

  @ApiProperty()
  nextPaymentDate?: Date;

  @ApiProperty()
  failedAttempts!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  canceledAt?: Date;
}
