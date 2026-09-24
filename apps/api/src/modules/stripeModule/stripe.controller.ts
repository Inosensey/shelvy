// src/stripe/stripe.controller.ts
import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiResponse } from 'src/utils/responseShaper';
import { createCheckoutDTO, verifyPaymentDTO } from './stripe.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';
import { ConfigService } from '@nestjs/config';
import type { AuthenticatedRequest } from 'src/types/request';
@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
  ) {}

  @Post('create-subscription-checkout/premium')
  async createSubscriptionCheckoutPremium(
    @Req() req: AuthenticatedRequest,
    @Body() data: createCheckoutDTO,
  ) {
    const plan = 'premium';
    const userId = req.user?.userId;
    const priceId = this.configService.get<string>('STRIPE_PREMIUM_PRICE_ID');
    if (!priceId) {
      throw new Error('STRIPE_PREMIUM_PRICE_ID is not configured');
    }
    const session = await this.stripeService.createSubscriptionCheckoutSession(
      data,
      plan,
      priceId,
      userId,
    );
    return ApiResponse.success(session, 'Stripe Session Successfully Created');
  }

  @Post('create-subscription-checkout/enterprise')
  async createSubscriptionCheckoutEnterprise(
    @Req() req: AuthenticatedRequest,
    @Body() data: createCheckoutDTO,
  ) {
    const plan = 'enterprise';
    const userId = req.user?.userId;
    const priceId = this.configService.get<string>(
      'STRIPE_ENTERPRISE_PRICE_ID',
    );
    if (!priceId) {
      throw new Error('STRIPE_ENTERPRISE_PRICE_ID is not configured');
    }
    const session = await this.stripeService.createSubscriptionCheckoutSession(
      data,
      plan,
      priceId,
      userId,
    );
    return ApiResponse.success(session, 'Stripe Session Successfully Created');
  }

  @Post('verify-payment')
  async verifyPayment(
    @Body() data: verifyPaymentDTO,
  ): Promise<ReturnType<typeof ApiResponse.success>> {
    const session = await this.stripeService.getSession(data);
    if (session.payment_status === 'paid') {
      return ApiResponse.success(session, 'Payment is Verified');
    }

    return ApiResponse.success(false, 'Payment failed to Verify');
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('cancel-subscription')
  async cancelSubscription(
    @Body() data: { stripeSubscriptionId: string; immediate: boolean },
  ): Promise<ReturnType<typeof ApiResponse.success>> {
    const response = await this.stripeService.cancelSubscription(
      data.stripeSubscriptionId,
      data.immediate,
    );
    return ApiResponse.success(response.data, response.message);
  }

  @Post('webhook')
  async handleWebhook(@Req() request: Request) {
    const signature = request.headers['stripe-signature'] as string;
    interface RequestWithRawBody extends Request {
      rawBody: Buffer;
    }
    const rawBody = (request as RequestWithRawBody).rawBody;

    // Add this check
    console.log('Raw body type:', typeof rawBody);
    console.log('Raw body exists:', !!rawBody);
    console.log('Signature:', signature);

    await this.stripeService.handleWebhook(rawBody, signature);
  }
}
