// subscription.service.ts
import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repository';
import {
  PaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from 'generated/prisma/client';
import Stripe from 'stripe';
import { invoiceSubscriptionId } from 'src/utils/stripe.util';

@Injectable()
export class SubscriptionService {
  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async activateSubscription(data: {
    userId: string;
    plan: SubscriptionPlan;
    status?: SubscriptionStatus;
    amount: number;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    stripePriceId: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    nextPaymentDate?: Date;
  }) {
    return this.subscriptionRepo.activate(data);
  }

  async recordInvoice(invoice: Stripe.Invoice, failed = false) {
    const stripeSubId = invoiceSubscriptionId(invoice);
    if (!stripeSubId || !invoice.id) return null;
    const sub =
      await this.subscriptionRepo.findByStripeSubscriptionId(stripeSubId);
    if (!sub) return null;
    const period = invoice.lines?.data[0]?.period;
    return this.subscriptionRepo.recordPayment({
      subscriptionId: sub.id,
      stripeInvoiceId: invoice.id,
      amount: failed ? invoice.amount_due : invoice.amount_paid,
      currency: invoice.currency,
      status: failed ? PaymentStatus.FAILED : PaymentStatus.COMPLETED,
      failureReason: failed ? 'Payment failed' : undefined,
      periodStart: new Date((period?.start ?? invoice.period_start) * 1000),
      periodEnd: new Date((period?.end ?? invoice.period_end) * 1000),
    });
  }

  async markPaid(
    stripeSubscriptionId: string,
    data: {
      lastPaymentDate: Date;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
    },
  ) {
    return this.subscriptionRepo.markPaid(stripeSubscriptionId, data);
  }

  async markPaymentFailed(stripeSubscriptionId: string, error: string) {
    return this.subscriptionRepo.markPaymentFailed(stripeSubscriptionId, error);
  }

  async syncFromStripe(
    stripeSubscriptionId: string,
    data: {
      status?: SubscriptionStatus;
      cancelAtPeriodEnd: boolean;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
    },
  ) {
    return this.subscriptionRepo.syncFromStripe(stripeSubscriptionId, data);
  }

  async createSubscriptionHistoryPayment(data: Stripe.Invoice) {
    const subscriptionId = data.lines?.data[0]?.subscription as string;
    const payload: {
      subscriptionId: string;
      stripeInvoiceId?: string;
      stripePaymentIntentId?: string;
      amount: number;
      currency: string;
      status: PaymentStatus;
      failureReason?: string;
      periodStart: Date;
      periodEnd: Date;
    } = {
      subscriptionId: subscriptionId,
      stripeInvoiceId: data.from_invoice?.invoice as string,
      amount: data.amount_paid,
      currency: data.currency,
      status:
        data.status === 'paid'
          ? PaymentStatus.COMPLETED
          : PaymentStatus.PENDING,
      failureReason: data.last_finalization_error?.message,
      periodStart: new Date(data.period_start * 1000),
      periodEnd: new Date(data.period_end * 1000),
    };
    return this.subscriptionRepo.createSubscriptionPaymentHistory(payload);
  }

  async getSubscriptionByUserId(userId: string) {
    return this.subscriptionRepo.findByUserId(userId);
  }

  async getSubscriptionByStripeId(stripeSubscriptionId: string) {
    return this.subscriptionRepo.findByStripeSubscriptionId(
      stripeSubscriptionId,
    );
  }

  async updateStatus(stripeSubscriptionId: string, status: SubscriptionStatus) {
    return this.subscriptionRepo.updateStatus(stripeSubscriptionId, status);
  }

  async updatePlan(
    stripeSubscriptionId: string,
    plan: SubscriptionPlan,
    stripePriceId: string,
  ) {
    return this.subscriptionRepo.updatePlan(
      stripeSubscriptionId,
      plan,
      stripePriceId,
    );
  }

  async updatePaymentDatesAndFailedAttempts(
    stripeSubscriptionId: string,
    data: {
      lastPaymentDate?: Date;
      nextPaymentDate?: Date;
      currentPeriodStart?: Date;
      currentPeriodEnd?: Date;
      failedAttempts?: number;
      lastPaymentError?: string;
    },
  ) {
    return this.subscriptionRepo.updatePaymentDatesAndFailedAttempts(
      stripeSubscriptionId,
      data,
    );
  }

  async cancelSubscription(stripeSubscriptionId: string) {
    return this.subscriptionRepo.cancel(stripeSubscriptionId);
  }

  async getUserPlan(userId: string): Promise<SubscriptionPlan | null> {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    return subscription?.plan ?? null;
  }

  async isSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    return subscription?.status === SubscriptionStatus.ACTIVE;
  }

  async setCancelAtPeriodEnd(
    stripeSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ) {
    return this.subscriptionRepo.setCancelAtPeriodEnd(
      stripeSubscriptionId,
      cancelAtPeriodEnd,
    );
  }

  async getPayments(subscriptionId: string, take: number = 12) {
    return this.subscriptionRepo.findPayments(subscriptionId, take);
  }
}
