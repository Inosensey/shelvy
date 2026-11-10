// subscription.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import {
  PaymentStatus,
  SubscriptionPlan,
  SubscriptionStatus,
} from 'generated/prisma/client';
import { PaymentInput } from 'src/types/subscription';

@Injectable()
export class SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async activate(data: {
    userId: string;
    plan: SubscriptionPlan;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    stripePriceId: string;
    amount: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
  }) {
    const { userId, ...rest } = data;
    const fields = {
      ...rest,
      status: SubscriptionStatus.ACTIVE,
      nextPaymentDate: data.currentPeriodEnd,
    };
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.upsert({
        where: { userId },
        create: { userId, ...fields },
        update: {
          ...fields,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          failedAttempts: 0,
          lastPaymentError: null,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { subscriptionPlan: data.plan },
      });
      return sub;
    });
  }

  async recordPayment(data: PaymentInput) {
    return this.prisma.subscriptionPaymentHistory.upsert({
      where: { stripeInvoiceId: data.stripeInvoiceId },
      create: data,
      update: {
        status: data.status,
        failureReason: data.failureReason,
        amount: data.amount,
      },
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
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        ...data,
        nextPaymentDate: data.currentPeriodEnd,
        status: SubscriptionStatus.ACTIVE,
        failedAttempts: 0,
        lastPaymentError: null,
      },
    });
  }

  async markPaymentFailed(stripeSubscriptionId: string, error: string) {
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: {
        status: SubscriptionStatus.PAST_DUE,
        failedAttempts: { increment: 1 },
        lastPaymentError: error,
      },
    });
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
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data,
    });
  }

  async setCancelAtPeriodEnd(
    stripeSubscriptionId: string,
    cancelAtPeriodEnd: boolean,
  ) {
    return this.prisma.subscription.update({
      where: { stripeSubscriptionId },
      data: { cancelAtPeriodEnd },
    });
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
    return this.prisma.$transaction(async (tx) => {
      const sub = await tx.subscription.update({
        where: { stripeSubscriptionId },
        data: {
          status: SubscriptionStatus.CANCELED,
          canceledAt: new Date(),
          cancelAtPeriodEnd: false,
        },
      });
      await tx.user.update({
        where: { id: sub.userId },
        data: { subscriptionPlan: SubscriptionPlan.FREE },
      });
      return sub;
    });
  }

  async findPayments(subscriptionId: string, take = 12) {
    return this.prisma.subscriptionPaymentHistory.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
