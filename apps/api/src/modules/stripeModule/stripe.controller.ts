// src/stripe/stripe.controller.ts
import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Get,
  HttpCode,
  type RawBodyRequest,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { StripeService } from './stripe.service';
import { ApiResponse as ApiResponseShaper } from 'src/utils/responseShaper';
import { SignupCheckoutDTO, UpgradeCheckoutDTO } from './stripe.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { PermissionsGuard } from 'src/guards/permission.guard';
import type { AuthenticatedRequest } from 'src/types/request';
import {
  ApiBody,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
@ApiTags('Stripe')
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
  @ApiCookieAuth('token')
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
    summary: 'Get subscription billing information',
    description:
      'Retrieves current subscription plan details, billing cycle boundaries, invoices, and Stripe portal linkage for the organization owner.',
  })
  @ApiCookieAuth('token')
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
            plan: {
              type: 'string',
              enum: ['FREE', 'PREMIUM', 'ENTERPRISE'],
              example: 'PREMIUM',
            },
            status: {
              type: 'string',
              nullable: true,
              example: 'ACTIVE',
            },
            amount: {
              type: 'number',
              description:
                'Subscription amount (omitted when on FREE plan without an active subscription record).',
              example: 299,
            },
            currentPeriodEnd: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2026-12-16T10:54:00.000Z',
            },
            nextPaymentDate: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: '2026-12-16T10:54:00.000Z',
            },
            cancelAtPeriodEnd: {
              type: 'boolean',
              example: false,
            },
            canceledAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              example: null,
            },
            failedAttempts: {
              type: 'number',
              example: 0,
            },
            lastPaymentError: {
              type: 'string',
              nullable: true,
              example: null,
            },
            payments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'cm3x8y9z00000pay123abc456' },
                  amount: {
                    type: 'number',
                    description:
                      'Payment amount in major currency units (e.g., USD).',
                    example: 299,
                  },
                  currency: { type: 'string', example: 'usd' },
                  status: { type: 'string', example: 'SUCCEEDED' },
                  periodStart: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                    example: '2026-11-16T10:54:00.000Z',
                  },
                  periodEnd: {
                    type: 'string',
                    format: 'date-time',
                    nullable: true,
                    example: '2026-12-16T10:54:00.000Z',
                  },
                  createdAt: {
                    type: 'string',
                    format: 'date-time',
                    example: '2026-11-16T10:54:00.000Z',
                  },
                  failureReason: {
                    type: 'string',
                    nullable: true,
                    example: null,
                  },
                },
              },
            },
            limits: {
              type: 'object',
              description: 'Plan limits derived from PLAN_LIMITS[orgPlan].',
              additionalProperties: true,
              example: { products: null, members: 10 },
            },
            usage: {
              type: 'object',
              nullable: true,
              description:
                'Current resource usage, or null if user has no organization.',
              properties: {
                products: { type: 'number', example: 42 },
                members: { type: 'number', example: 3 },
              },
            },
          },
          required: ['plan', 'status', 'payments', 'limits', 'usage'],
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
  @ApiCookieAuth('token')
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
  @ApiCookieAuth('token')
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
  @ApiCookieAuth('token')
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
  @ApiExcludeEndpoint()
  @HttpCode(200)
  @Post('webhook')
  async handleWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string' || !req.rawBody) {
      throw new BadRequestException('Missing Stripe signature or body');
    }
    await this.stripeService.handleWebhook(req.rawBody, signature);
  }
}
