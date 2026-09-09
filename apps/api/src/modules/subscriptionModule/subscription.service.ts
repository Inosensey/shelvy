// subscription.service.ts
import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repository';
import {
  PaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from 'generated/prisma/client';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionService {
  constructor(private readonly subscriptionRepo: SubscriptionRepository) {}

  async createSubscription(data: {
    userId: string;
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    nextPaymentDate?: Date;
  }) {
    return this.subscriptionRepo.create(data);
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

  // Helper — check what plan a user is on
  async getUserPlan(userId: string): Promise<SubscriptionPlan | null> {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    return subscription?.plan ?? null;
  }

  // Helper — check if user has active subscription
  async isSubscriptionActive(userId: string): Promise<boolean> {
    const subscription = await this.subscriptionRepo.findByUserId(userId);
    return subscription?.status === SubscriptionStatus.ACTIVE;
  }
}
