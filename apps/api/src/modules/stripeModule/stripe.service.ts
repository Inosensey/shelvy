// src/stripe/stripe.service.ts
import { Injectable, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import Stripe, { Subscription } from 'stripe';
import { ConfigService } from '@nestjs/config';
import { createCheckoutDTO, verifyPaymentDTO } from './stripe.dto';
import { StripeRepository } from './stripe.repository';
import { ApiResponse } from 'src/utils/responseShaper';
import {
  AuthProvider,
  Prisma,
  Role,
  SubscriptionPlan,
  SubscriptionStatus,
} from 'generated/prisma/client';
import { UserResponseDTO } from '../usersModule/user.dto';
import { AuthService } from '../authModule/auth.service';
import { SubscriptionService } from '../subscriptionModule/subscription.service';
import { UserService } from '../usersModule/user.service';

@Injectable()
export class StripeService {
  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private configService: ConfigService,
    private readonly stripeRepo: StripeRepository,
    private readonly authService: AuthService,
    private readonly subscriptionService: SubscriptionService,
    private readonly user: UserService,
  ) {}

  async createStripeCustomer(email: string): Promise<Stripe.Customer> {
    return await this.stripeRepo.createCustomer(email);
  }
  async getOrCreateStripeCustomer(
    email: string,
    userId?: string,
  ): Promise<string> {
    if (userId) {
      const stripeCustomerId = await this.user.getStripeCustomerId(userId);

      if (stripeCustomerId) {
        return stripeCustomerId;
      }
    }

    const newStripeCustomer = await this.createStripeCustomer(email);

    // Save to database
    // await this.user.updateStripeCustomerId(userId, newStripeCustomer.id);

    return newStripeCustomer.id;
  }
  async createSubscriptionCheckoutSession(
    data: createCheckoutDTO,
    plan: string,
    priceId: string,
    userId: string,
  ) {
    const stripeCustomerId = await this.getOrCreateStripeCustomer(
      data.email,
      userId,
    );
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const isLoggedIn = userId ? 'true' : 'false';
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: stripeCustomerId,
      metadata: {
        userId: userId ? userId : null,
        email: data.email,
        password: hashedPassword,
        plan: plan,
      },
      success_url: `${this.configService.get('FRONTEND_URL')}/subscription/success?subscription_id={CHECKOUT_SESSION_ID}&logged_in=${isLoggedIn}`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/subscription/cancel`,
    });

    return { sessionId: session.id, url: session.url };
  }

  async cancelSubscription(
    stripeSubscriptionId: string,
    immediate: boolean = false,
  ): Promise<
    ApiResponse<
      { activeUntil: Date } | Stripe.Refund | Subscription | undefined
    >
  > {
    if (immediate) {
      const proratedAmount =
        await this.calculateProratedAmount(stripeSubscriptionId);

      const canceledSub =
        await this.stripe.subscriptions.cancel(stripeSubscriptionId);

      if (proratedAmount > 0) {
        const refundResponse = await this.issueProratedRefund(
          stripeSubscriptionId,
          proratedAmount,
        );
        return {
          data: refundResponse.data,
          message: `Subscription canceled with prorated refund of $${proratedAmount / 100}`,
          success: refundResponse.status,
        };
      } else {
        return {
          data: canceledSub,
          message: 'Subscription canceled immediately (no refund due)',
          success: true,
        };
      }
    } else {
      const subscription: Stripe.Subscription =
        await this.stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

      // await this.sendRetentionEmail(stripeSubscriptionId);

      return {
        data: {
          activeUntil: new Date(
            subscription.items.data[0].current_period_end * 1000,
          ),
        },
        message: 'Subscription will cancel at end of billing period',
        success: true,
      };
    }
  }

  async issueProratedRefund(
    subscriptionId: string,
    amount: number,
  ): Promise<{ status: boolean; data?: Stripe.Refund; message: string }> {
    try {
      if (amount === 0) {
        return {
          status: true,
          message: 'No prorated amount to refund',
        };
      }

      const invoices = await this.stripe.invoices.list({
        subscription: subscriptionId,
        limit: 10,
        status: 'paid',
      });

      let paymentIntentId: string | null = null;

      for (const invoice of invoices.data) {
        const invoicePayments = await this.stripe.invoicePayments.list({
          invoice: invoice.id,
          limit: 1,
        });

        if (invoicePayments.data.length > 0) {
          const invoicePayment = invoicePayments.data[0];
          if (invoicePayment.payment?.type === 'payment_intent') {
            paymentIntentId = invoicePayment.payment.payment_intent as string;
            break;
          }
        }
      }

      if (!paymentIntentId) {
        throw new Error('No payment intent found to refund from');
      }

      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount,
      });

      return {
        status: true,
        data: refund,
        message: `Refund issued: ${refund.id} for ${amount / 100}`,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error issuing prorated refund: ${message}`);
    }
  }

  async calculateProratedAmount(subscriptionId: string): Promise<number> {
    const subscription =
      await this.stripe.subscriptions.retrieve(subscriptionId);

    const items = subscription.items.data.map((item) => ({
      id: item.id,
      price: item.price.id,
      quantity: 0,
    }));

    const upcomingPreview = await this.stripe.invoices.createPreview({
      customer: subscription.customer as string,
      subscription: subscriptionId,
      subscription_details: {
        items: items,
        proration_behavior: 'create_prorations',
      },
    });

    let proratedAmount = 0;
    if (upcomingPreview.lines?.data) {
      for (const line of upcomingPreview.lines.data) {
        if (
          line.amount < 0 &&
          line.parent?.subscription_item_details?.proration
        ) {
          proratedAmount += Math.abs(line.amount);
        }
      }
    }

    return proratedAmount;
  }

  async getSession(data: verifyPaymentDTO): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(data.sessionId, {
      expand: ['payment_intent', 'subscription', 'invoice'],
    });
  }

  async handleSubscriptionPaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionLine = invoice.lines?.data[0];
    const subscriptionId = subscriptionLine?.subscription;

    if (!subscriptionId || typeof subscriptionId !== 'string') {
      console.log('No valid subscription found in invoice');
      return;
    }

    const subscription =
      await this.subscriptionService.getSubscriptionByStripeId(subscriptionId);

    if (!subscription) return;

    await this.subscriptionService.updateStatus(
      subscriptionId,
      SubscriptionStatus.PAST_DUE,
    );
    await this.subscriptionService.updatePaymentDatesAndFailedAttempts(
      subscriptionId,
      {
        failedAttempts: (subscription.failedAttempts || 0) + 1,
        lastPaymentError:
          invoice.last_finalization_error?.message || 'Payment failed',
      },
    );

    console.log(
      `💳 Subscription ${subscription.id} payment failed: ${invoice.last_finalization_error?.message}`,
    );
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!rawBody) {
      throw new Error('No raw body found');
    }
    const event = this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
    }
  }

  async updateSubscriptionInfo(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.lines?.data[0]?.subscription as string;
    // const stripePriceId = invoice.lines?.data[0]?.pricing?.price_details
    //   ?.price as string;

    if (!subscriptionId) {
      console.log('No subscription found in invoice');
      return;
    }
    const subscription =
      await this.subscriptionService.getSubscriptionByStripeId(subscriptionId);

    if (!subscription) return;

    // Reactivate if it was PAST_DUE
    await this.subscriptionService.updateStatus(
      subscriptionId,
      SubscriptionStatus.ACTIVE,
    );
    await this.subscriptionService.updatePaymentDatesAndFailedAttempts(
      subscriptionId,
      {
        lastPaymentDate: new Date(invoice.status_transitions.paid_at! * 1000),
        nextPaymentDate: new Date(invoice.next_payment_attempt! * 1000),
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000),
      },
    );

    console.log(`✅ Subscription ${subscription.id} payment recovered!`);
  }

  async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    if (session.mode === 'subscription') {
      const { email, plan, password, userId } = session.metadata as {
        userId: string | null;
        email: string;
        password: string;
        plan: string;
      };

      const subscriptionPlan =
        plan === 'premium'
          ? SubscriptionPlan.PREMIUM
          : SubscriptionPlan.ENTERPRISE;

      const stripeSubscription: Stripe.Subscription =
        await this.stripe.subscriptions.retrieve(
          session.subscription as string,
        );
      const firstItem = stripeSubscription.items.data[0];
      let existingUser: UserResponseDTO | null = null;
      const passwordAlreadyHashed = true;

      if (userId) {
        existingUser = await this.authService.getUserById(userId);
      }

      if (existingUser) {
        await this.authService.updateUserStripeCustomerId(
          existingUser.id,
          session.customer as string,
        );

        await this.stripeRepo.updateCustomerShelvyId(
          session.customer as string,
          existingUser.id,
        );

        await this.subscriptionService.createSubscription({
          userId: existingUser.id,
          plan: subscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: session.id,
          stripeCustomerId: session.customer as string,
          stripePriceId: firstItem.price.id,
          currentPeriodStart: new Date(firstItem.current_period_start * 1000),
          currentPeriodEnd: new Date(firstItem.current_period_end * 1000),
          nextPaymentDate: new Date(firstItem.current_period_end * 1000),
        });
      } else {
        const userPayload: Prisma.UserCreateInput = {
          email: email,
          authProvider: AuthProvider.LOCAL,
          subscriptionPlan: subscriptionPlan,
          stripeCustomerId: session.customer as string,
          password: password,
          role: Role.OWNER,
        };

        const newUser: UserResponseDTO = await this.authService.createUser(
          userPayload,
          passwordAlreadyHashed,
        );

        await this.stripeRepo.updateCustomerShelvyId(
          session.customer as string,
          newUser.id,
        );

        await this.subscriptionService.createSubscription({
          userId: newUser.id,
          plan: subscriptionPlan,
          status: SubscriptionStatus.ACTIVE,
          stripeSubscriptionId: session.id,
          stripeCustomerId: session.customer as string,
          stripePriceId: firstItem.price.id,
          currentPeriodStart: new Date(firstItem.current_period_start * 1000),
          currentPeriodEnd: new Date(firstItem.current_period_end * 1000),
          nextPaymentDate: new Date(firstItem.current_period_end * 1000),
        });
      }
    }
  }

  async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.parent?.subscription_details
      ?.subscription as string;

    const subscription =
      await this.subscriptionService.getSubscriptionByStripeId(subscriptionId);

    if (subscription) {
      await this.updateSubscriptionInfo(invoice);
      await this.subscriptionService.createSubscriptionHistoryPayment(invoice);
    }
  }

  async handleSubscriptionDeleted(Subscription: Stripe.Subscription) {
    const subscription =
      await this.subscriptionService.getSubscriptionByStripeId(Subscription.id);

    if (!subscription) {
      console.log('No subscription found in invoice');
      return;
    }

    await this.subscriptionService.cancelSubscription(
      subscription.stripeSubscriptionId!,
    );
  }
}
