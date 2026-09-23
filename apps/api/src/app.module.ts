import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './PrismaConfig/prisma.module';
import { StripeModule } from './modules/stripeModule/stripe.module';
import { SubscriptionModule } from './modules/subscriptionModule/subscription.module';
import { AuthModule } from './modules/authModule/auth.module';
import { UserModule } from './modules/usersModule/user.module';
import { ConfigModule } from '@nestjs/config';
import { OrganizationModule } from './modules/organizationModule/organization.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    ConfigModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    StripeModule,
    SubscriptionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
