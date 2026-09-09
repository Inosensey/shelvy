// subscription.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import {
  PaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from 'generated/prisma/client';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    plan: SubscriptionPlan;
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
    stripePriceId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    nextPaymentDate?: Date;
  }) {
    return this.prisma.subscription.create({ data });
  }

  async createSubscriptionPaymentHistory(data: {
    subscriptionId: string;
    stripeInvoiceId?: string;
    stripePaymentIntentId?: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    failureReason?: string;
    periodStart: Date;
    periodEnd: Date;
  }) {
    return this.prisma.subscriptionPaymentHistory.create({ data });
  }

  async findByUserId(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
    });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string) {
    return this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
  }

  async updateStatus(stripeSubscriptionId: string, status: SubscriptionStatus) {
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: { status },
    });
  }

  async updatePlan(
    stripeSubscriptionId: string,
    plan: SubscriptionPlan,
    stripePriceId: string,
  ) {
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: { plan, stripePriceId },
    });
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
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data,
    });
  }

  async updatePaymentAmount(stripeSubscriptionId: string, amount: number) {
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: { amount },
    });
  }

  async cancel(stripeSubscriptionId: string) {
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: SubscriptionStatus.CANCELED,
        canceledAt: new Date(),
        cancelAtPeriodEnd: true,
      },
    });
  }
}
