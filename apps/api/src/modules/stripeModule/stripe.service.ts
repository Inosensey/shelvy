// src/stripe/stripe.service.ts
import {
  Injectable,
  Inject,
  InternalServerErrorException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import Stripe, { Subscription } from 'stripe';
import { ConfigService } from '@nestjs/config';
import { PaidPlan, SignupCheckoutDTO, verifyPaymentDTO } from './stripe.dto';
import { StripeRepository } from './stripe.repository';
import { ApiResponse } from 'src/utils/responseShaper';
import {
  AuthProvider,
  Role,
  SubscriptionPlan,
  SubscriptionStatus,
} from 'generated/prisma/client';
import { AuthService } from '../authModule/auth.service';
import { SubscriptionService } from '../subscriptionModule/subscription.service';
import { UserService } from '../usersModule/user.service';
import { AuthenticatedRequest } from 'src/types/request';
import { invoiceSubscriptionId, mapStripeStatus } from 'src/utils/stripe.util';
import { PlanService } from '../planModule/plan.service';
import { PLAN_LIMITS } from '../planModule/plan.limits';

@Injectable()
export class StripeService {
  constructor(
    @Inject('STRIPE_CLIENT') private readonly stripe: Stripe,
    private configService: ConfigService,
    private readonly stripeRepo: StripeRepository,
    private readonly authService: AuthService,
    private readonly subscriptionService: SubscriptionService,
    private readonly user: UserService,
    private readonly planService: PlanService,
  ) {}
  private readonly logger = new Logger(StripeService.name);

  priceFor(plan: PaidPlan): string {
    const key =
      plan === PaidPlan.PREMIUM
        ? 'STRIPE_PREMIUM_PRICE_ID'
        : 'STRIPE_ENTERPRISE_PRICE_ID';
    const id = this.configService.get<string>(key);
    if (!id) throw new InternalServerErrorException(`${key} is not configured`);
    return id;
  }

  assertOwner(req: AuthenticatedRequest) {
    if (req.user.userType !== Role.OWNER) {
      throw new ForbiddenException('Only the owner can manage billing.');
    }
  }
  private checkoutUrls(isLoggedIn: boolean) {
    const base = this.configService.get<string>('FRONTEND_URL');
    return {
      success_url: `${base}/subscription/success?subscription_id={CHECKOUT_SESSION_ID}&logged_in=${isLoggedIn}`,
      cancel_url: `${base}/subscription/cancel`,
    };
  }

  async createSignupCheckout(data: SignupCheckoutDTO, priceId: string) {
    if (await this.authService.getUserByEmail(data.email)) {
      throw new ConflictException(
        'An account with this email already exists. Sign in and upgrade instead.',
      );
    }
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: data.email,
      metadata: {
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        plan: data.plan,
      },
      ...this.checkoutUrls(false),
    });
    return { sessionId: session.id, url: session.url };
  }

  async createUpgradeCheckout(userId: string, plan: PaidPlan, priceId: string) {
    const user = await this.authService.getUserById(userId);
    if (!user) throw new NotFoundException('User not found.');
    console.log(user);
    if (user.subscriptionPlan !== SubscriptionPlan.FREE) {
      throw new ConflictException(
        'You already have a paid plan. Manage it from Billing.',
      );
    }
    const customerId = await this.user.getStripeCustomerId(userId);
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(customerId
        ? { customer: customerId }
        : { customer_email: user.email }),
      metadata: { userId, plan }, // no email or password for upgrades
      ...this.checkoutUrls(true),
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
      case 'invoice.payment_failed':
        await this.handleSubscriptionPaymentFailed(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
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
    if (session.mode !== 'subscription') return;

    const { email, plan, password, userId } = (session.metadata ?? {}) as {
      userId?: string;
      email?: string;
      password?: string;
      plan: string;
    };
    const subscriptionPlan =
      plan === 'premium'
        ? SubscriptionPlan.PREMIUM
        : SubscriptionPlan.ENTERPRISE;
    const stripeSubscriptionId = session.subscription as string; // sub_..., not session.id
    const customerId = session.customer as string;

    const stripeSub =
      await this.stripe.subscriptions.retrieve(stripeSubscriptionId);
    const item = stripeSub.items.data[0];

    let ownerId: string;
    if (userId) {
      const existing = await this.authService.getUserById(userId);
      if (!existing) {
        this.logger.error(`Checkout ${session.id}: user ${userId} not found`);
        return;
      }
      ownerId = existing.id;
      await this.authService.updateUserStripeCustomerId(ownerId, customerId);
    } else {
      const existingUser = await this.authService.getUserByEmail(email!); // add: findUnique select id
      if (existingUser) {
        // Either a webhook retry that already got this far, or a real conflict
        const already =
          await this.subscriptionService.getSubscriptionByStripeId(
            stripeSubscriptionId,
          );
        if (!already) {
          this.logger.error(
            `Paid signup for existing email ${email} (session ${session.id}): needs manual fix or refund`,
          );
          return; // no throw, so Stripe stops retrying
        }
        ownerId = existingUser.id;
      } else {
        const newUser = await this.authService.createUser(
          {
            email: email!,
            authProvider: AuthProvider.LOCAL,
            subscriptionPlan,
            stripeCustomerId: customerId,
            password: password!,
          },
          Role.OWNER,
          true,
        );
        ownerId = newUser.id;
      }
    }

    await this.stripeRepo.updateCustomerShelvyId(customerId, ownerId);
    await this.subscriptionService.activateSubscription({
      userId: ownerId,
      plan: subscriptionPlan,
      stripeSubscriptionId,
      stripeCustomerId: customerId,
      stripePriceId: item.price.id,
      amount: (item.price.unit_amount ?? 0) / 100,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
    });

    // First invoice: invoice.paid may have arrived before the row existed
    if (typeof session.invoice === 'string') {
      const invoice = await this.stripe.invoices.retrieve(session.invoice);
      await this.subscriptionService.recordInvoice(invoice);
    }
  }

  async handleInvoicePaid(invoice: Stripe.Invoice) {
    const stripeSubId = invoiceSubscriptionId(invoice);
    if (!stripeSubId) return;
    const sub =
      await this.subscriptionService.getSubscriptionByStripeId(stripeSubId);
    if (!sub) return; // first invoice: the checkout handler records it

    const period = invoice.lines.data[0].period;
    await this.subscriptionService.markPaid(stripeSubId, {
      lastPaymentDate: new Date(
        (invoice.status_transitions.paid_at ?? invoice.created) * 1000,
      ),
      currentPeriodStart: new Date(period.start * 1000),
      currentPeriodEnd: new Date(period.end * 1000),
    });
    await this.subscriptionService.recordInvoice(invoice);
  }

  async handleSubscriptionPaymentFailed(invoice: Stripe.Invoice) {
    const stripeSubId = invoiceSubscriptionId(invoice);
    if (!stripeSubId) return;
    const sub =
      await this.subscriptionService.getSubscriptionByStripeId(stripeSubId);
    if (!sub) return;

    await this.subscriptionService.markPaymentFailed(
      stripeSubId,
      'Payment failed',
    );
    await this.subscriptionService.recordInvoice(invoice, true);
  }

  async handleSubscriptionUpdated(stripeSub: Stripe.Subscription) {
    const sub = await this.subscriptionService.getSubscriptionByStripeId(
      stripeSub.id,
    );
    if (!sub) return;
    const item = stripeSub.items.data[0];
    await this.subscriptionService.syncFromStripe(stripeSub.id, {
      status: mapStripeStatus(stripeSub.status) ?? undefined,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      currentPeriodStart: new Date(item.current_period_start * 1000),
      currentPeriodEnd: new Date(item.current_period_end * 1000),
    });
  }

  async handleSubscriptionDeleted(stripeSub: Stripe.Subscription) {
    const sub = await this.subscriptionService.getSubscriptionByStripeId(
      stripeSub.id,
    );
    if (!sub) return;
    await this.subscriptionService.cancelSubscription(stripeSub.id); // now downgrades the user too
  }

  async setCancelAtPeriodEnd(userId: string, cancel: boolean) {
    const sub = await this.subscriptionService.getSubscriptionByUserId(userId);
    if (
      !sub?.stripeSubscriptionId ||
      sub.status === SubscriptionStatus.CANCELED
    ) {
      throw new NotFoundException('No active subscription found.');
    }
    const updated = await this.stripe.subscriptions.update(
      sub.stripeSubscriptionId,
      {
        cancel_at_period_end: cancel,
      },
    );
    await this.subscriptionService.setCancelAtPeriodEnd(
      sub.stripeSubscriptionId,
      updated.cancel_at_period_end,
    );
    return {
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      activeUntil: new Date(updated.items.data[0].current_period_end * 1000),
    };
  }

  async getBilling(userId: string, organizationId: string | null) {
    const orgPlan = organizationId
      ? await this.planService.getPlan(organizationId)
      : SubscriptionPlan.FREE;
    const usage = organizationId
      ? await this.planService.getUsage(organizationId)
      : null;
    const extra = {
      limits: PLAN_LIMITS[orgPlan],
      usage: usage && { products: usage.products, members: usage.members },
    };

    const sub = await this.subscriptionService.getSubscriptionByUserId(userId);
    if (!sub) {
      return {
        plan: SubscriptionPlan.FREE,
        status: null,
        payments: [],
        ...extra,
      };
    }
    const payments = await this.subscriptionService.getPayments(sub.id);
    return {
      plan: sub.plan,
      status: sub.status,
      amount: Number(sub.amount),
      currentPeriodEnd: sub.currentPeriodEnd,
      nextPaymentDate: sub.nextPaymentDate,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      canceledAt: sub.canceledAt,
      failedAttempts: sub.failedAttempts,
      lastPaymentError: sub.lastPaymentError,
      payments: payments.map((p) => ({
        id: p.id,
        amount: p.amount, // cents; the UI formats it
        currency: p.currency,
        status: p.status,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        createdAt: p.createdAt,
        failureReason: p.failureReason,
      })),
      ...extra,
    };
  }

  async createBillingPortalSession(userId: string) {
    const customerId = await this.user.getStripeCustomerId(userId);
    if (!customerId) throw new NotFoundException('No billing account found.');
    const session = await this.stripeRepo.createBillingPortalSession(
      customerId,
      `${this.configService.get('FRONTEND_URL')}/dashboard/settings?tab=billing`,
    );
    return { url: session.url };
  }
}
