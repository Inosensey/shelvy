// src/stripe/stripe.controller.ts
import { Controller, Post, Body, Req, UseGuards, Get } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';
import {
  SignupCheckoutDTO,
  UpgradeCheckoutDTO,
  verifyPaymentDTO,
} from './stripe.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';
import type { AuthenticatedRequest } from 'src/types/request';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  SkipThrottle,
  Throttle,
} from '@nestjs/throttler/dist/throttler.decorator';
@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @ApiOperation({
    summary: 'Create a Stripe checkout session for platform signup',
    description:
      'Generates a Stripe Checkout URL for initial account registration and plan subscription.',
  })
  @ApiBody({ type: SignupCheckoutDTO })
  @ApiResponse({
    status: 201,
    description: 'Stripe Session Successfully Created.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Stripe Session Successfully Created',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cs_test_a1b2c3d4...' },
            url: { type: 'string', example: 'https://stripe.com...' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid signup data or invalid tier selected.',
  })
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('checkout/signup')
  async checkoutSignup(@Body() dto: SignupCheckoutDTO) {
    const session = await this.stripeService.createSignupCheckout(
      dto,
      this.stripeService.priceFor(dto.plan),
    );
    return ApiResponseShaper.success(
      session,
      'Stripe Session Successfully Created',
    );
  }

  @ApiOperation({
    summary: 'Create a Stripe checkout session for plan upgrade',
    description:
      'Allows organization owners to upgrade their subscription tier by generating a Stripe checkout link.',
  })
  @ApiBody({ type: UpgradeCheckoutDTO })
  @ApiResponse({
    status: 201,
    description: 'Stripe Session Successfully Created.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Stripe Session Successfully Created',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cs_test_x9y8z7...' },
            url: { type: 'string', example: 'https://stripe.com...' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Access restricted to organization owners only.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('checkout/upgrade')
  async checkoutUpgrade(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpgradeCheckoutDTO,
  ) {
    this.stripeService.assertOwner(req);
    const session = await this.stripeService.createUpgradeCheckout(
      req.user.userId,
      dto.plan,
      this.stripeService.priceFor(dto.plan),
    );
    return ApiResponseShaper.success(
      session,
      'Stripe Session Successfully Created',
    );
  }

  @ApiOperation({
    summary: 'Verify payment status of a checkout session',
    description:
      'Checks a given Stripe transaction ID or reference data to confirm whether the payment status is marked as paid.',
  })
  @ApiBody({ type: verifyPaymentDTO })
  @ApiResponse({
    status: 201,
    description: 'Payment verification check completed.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Payment is Verified' },
        data: {
          type: 'boolean',
          description:
            'True if payment status is explicitly "paid", false otherwise.',
          example: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request. Session token missing or invalid lookup parameters.',
  })
  @Post('verify-payment')
  async verifyPayment(@Body() data: verifyPaymentDTO) {
    const session = await this.stripeService.getSession(data);
    const paid = session.payment_status === 'paid';
    return ApiResponseShaper.success(
      paid,
      paid ? 'Payment is Verified' : 'Payment failed to Verify',
    );
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('cancel-subscription')
  async cancelSubscription(
    @Body() data: { stripeSubscriptionId: string; immediate: boolean },
  ): Promise<ReturnType<typeof ApiResponseShaper.success>> {
    const response = await this.stripeService.cancelSubscription(
      data.stripeSubscriptionId,
      data.immediate,
    );
    return ApiResponseShaper.success(response.data, response.message);
  }

  @ApiOperation({
    summary: 'Get subscription billing information',
    description:
      'Retrieves current subscription plan details, billing cycle boundaries, invoices, and Stripe portal linkage for the organization owner.',
  })
  @ApiResponse({
    status: 200,
    description: 'Billing information retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Billing retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            planName: { type: 'string', example: 'Premium Tier' },
            status: { type: 'string', example: 'active' },
            currentPeriodEnd: {
              type: 'string',
              format: 'date-time',
              example: '2026-12-05T00:00:00.000Z',
            },
            cancelAtPeriodEnd: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Access restricted to organization owners only.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Get('billing')
  async getBilling(@Req() req: AuthenticatedRequest) {
    this.stripeService.assertOwner(req);
    const data = await this.stripeService.getBilling(
      req.user.userId,
      req.user.organizationId,
    );
    return ApiResponseShaper.success(data, 'Billing retrieved successfully');
  }

  @ApiOperation({
    summary: 'Cancel active subscription at period end',
    description:
      'Sets the subscription status to cancel automatically at the close of the current paid billing cycle, preventing future charges.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancellation scheduled successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Your plan will end at the end of the billing period.',
        },
        data: {
          type: 'object',
          properties: {
            cancelAtPeriodEnd: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Access restricted to organization owners only.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('subscription/cancel')
  async cancel(@Req() req: AuthenticatedRequest) {
    this.stripeService.assertOwner(req);
    const data = await this.stripeService.setCancelAtPeriodEnd(
      req.user.userId,
      true,
    );
    return ApiResponseShaper.success(
      data,
      'Your plan will end at the end of the billing period.',
    );
  }

  @ApiOperation({
    summary: 'Resume subscription auto-renewal',
    description:
      'Reverses a pending subscription cancellation, ensuring continuous service and auto-billing at the end of the period.',
  })
  @ApiResponse({
    status: 200,
    description: 'Subscription auto-renewal reactivated successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Your plan will continue.' },
        data: {
          type: 'object',
          properties: {
            cancelAtPeriodEnd: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Access restricted to organization owners only.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Post('subscription/resume')
  async resume(@Req() req: AuthenticatedRequest) {
    this.stripeService.assertOwner(req);
    const data = await this.stripeService.setCancelAtPeriodEnd(
      req.user.userId,
      false,
    );
    return ApiResponseShaper.success(data, 'Your plan will continue.');
  }

  @ApiOperation({
    summary: 'Create a Stripe customer portal session',
    description:
      'Generates a short-lived link to the hosted Stripe Customer Portal, allowing organization owners to manage saved payment methods, billing details, and view invoice history natively.',
  })
  @ApiResponse({
    status: 201,
    description: 'Stripe Customer Portal session link generated successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Portal session created' },
        data: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              example: 'https://stripe.com...',
              description: 'The secure link to redirect the user to Stripe.',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access token missing or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden. Access restricted to organization owners only.',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('billing/portal')
  async createBillingPortalSession(@Req() req: AuthenticatedRequest) {
    this.stripeService.assertOwner(req);
    const data = await this.stripeService.createBillingPortalSession(
      req.user.userId,
    );
    return ApiResponseShaper.success(data, 'Portal session created');
  }

  @SkipThrottle()
  @Post('webhook')
  async handleWebhook(@Req() request: Request) {
    const signature = request.headers['stripe-signature'] as string;
    interface RequestWithRawBody extends Request {
      rawBody: Buffer;
    }
    const rawBody = (request as RequestWithRawBody).rawBody;

    await this.stripeService.handleWebhook(rawBody, signature);
  }
}
