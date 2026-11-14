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
import { NodemailerModule } from './NodemailerConfig/Nodemailer.module';
import { SocketGatewayModule } from './socketGateway/gateway.module';
import { NotificationModule } from './modules/notificationModule/notification.module';
import { SupplierModule } from './modules/supplierModule/supplier.module';
import { ProductModule } from './modules/productModule/product.module';
import { StockMovementModule } from './modules/stockMovementModule/stockMovement.module';
import { StockMovementRequestModule } from './modules/stockMovementRequestModule/stockMovementRequest.module';
import { DashboardModule } from './modules/dashboardModule/dashboard.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ClientIpThrottlerGuard } from './guards/clientIpThrottler.guard';
import { APP_GUARD } from '@nestjs/core/constants';
import { PlanModule } from './modules/planModule/plan.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    DashboardModule,
    AuthModule,
    UserModule,
    OrganizationModule,
    SupplierModule,
    ProductModule,
    StockMovementModule,
    StockMovementRequestModule,
    StripeModule,
    SubscriptionModule,
    NodemailerModule,
    SocketGatewayModule,
    NotificationModule,
    PlanModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ClientIpThrottlerGuard },
  ],
})
export class AppModule {}
