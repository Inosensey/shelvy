// subscription.module.ts
import { Module } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionRepository } from './subscription.repository';

@Module({
  providers: [SubscriptionService, SubscriptionRepository],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
