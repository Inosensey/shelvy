// src/stripe/stripe.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { StripeRepository } from './stripe.repository';
import { AuthModule } from '../authModule/auth.module';
import { SubscriptionModule } from '../subscriptionModule/subscription.module';
import { UserModule } from '../usersModule/user.module';

@Global()
@Module({
  imports: [ConfigModule, AuthModule, SubscriptionModule, UserModule],
  controllers: [StripeController],
  providers: [
    StripeService,
    StripeRepository,
    {
      provide: 'STRIPE_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Stripe(configService.get<string>('STRIPE_SECRET_KEY')!, {});
      },
      inject: [ConfigService],
    },
  ],
  exports: [StripeService, 'STRIPE_CLIENT'],
})
export class StripeModule {}
