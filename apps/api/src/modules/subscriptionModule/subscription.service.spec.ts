/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// subscription.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { SubscriptionRepository } from './subscription.repository';
import {
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentStatus,
} from 'generated/prisma/client';

// ============================================
// MOCKS
// ============================================
const mockSubscriptionRepository = {
  create: jest.fn(),
  createSubscriptionPaymentHistory: jest.fn(),
  findByUserId: jest.fn(),
  findByStripeSubscriptionId: jest.fn(),
  updateStatus: jest.fn(),
  updatePlan: jest.fn(),
  updatePaymentDatesAndFailedAttempts: jest.fn(),
  cancel: jest.fn(),
};

// ============================================
// REUSABLE TEST DATA
// ============================================
const mockSubscription = {
  id: 'sub-123',
  userId: 'user-123',
  plan: SubscriptionPlan.PREMIUM,
  status: SubscriptionStatus.ACTIVE,
  stripeSubscriptionId: 'stripe_sub_123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockInvoicePaid = {
  id: 'sub_123',
  status: 'paid',
  amount_paid: 2999,
  currency: 'usd',
  period_start: Math.floor(Date.now() / 1000) - 2592000,
  period_end: Math.floor(Date.now() / 1000),
  next_payment_attempt: Math.floor(Date.now() / 1000) + 2592000,
  from_invoice: {
    invoice: 'inv_123',
  },
  last_finalization_error: undefined,
  status_transitions: {
    paid_at: Math.floor(Date.now() / 1000),
  },
  lines: {
    data: [
      {
        subscription: 'stripe_sub_123',
      },
    ],
  },
};
const mockInvoicePending = {
  ...mockInvoicePaid,
  status: 'pending',
  last_finalization_error: { message: 'card decline' },
};

// ============================================
// TEST SUITE
// ============================================
describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: SubscriptionRepository,
          useValue: mockSubscriptionRepository,
        },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // createSubscriptionHistoryPayment tests
  // ============================================
  describe('createSubscriptionHistoryPayment', () => {
    it('should map paid invoice status to COMPLETED', async () => {
      const mockPayloadCompleteStatus = {
        subscriptionId: mockInvoicePaid.lines.data[0].subscription,
        stripeInvoiceId: mockInvoicePaid.from_invoice.invoice,
        amount: mockInvoicePaid.amount_paid,
        currency: mockInvoicePaid.currency,
        status: PaymentStatus.COMPLETED,
        failureReason: mockInvoicePaid.last_finalization_error,
        periodStart: expect.any(Date),
        periodEnd: expect.any(Date),
      };
      await subscriptionService.createSubscriptionHistoryPayment(
        mockInvoicePaid as any,
      );

      expect(
        mockSubscriptionRepository.createSubscriptionPaymentHistory,
      ).toHaveBeenCalledWith(mockPayloadCompleteStatus);
    });

    it('should map non-paid invoice status to PENDING', async () => {
      const mockPayloadPendingStatus = {
        subscriptionId: mockInvoicePending.lines.data[0].subscription,
        stripeInvoiceId: mockInvoicePending.from_invoice.invoice,
        amount: mockInvoicePending.amount_paid,
        currency: mockInvoicePending.currency,
        status: PaymentStatus.PENDING,
        failureReason: mockInvoicePending.last_finalization_error.message,
        periodStart: expect.any(Date),
        periodEnd: expect.any(Date),
      };
      await subscriptionService.createSubscriptionHistoryPayment(
        mockInvoicePending as any,
      );

      expect(
        mockSubscriptionRepository.createSubscriptionPaymentHistory,
      ).toHaveBeenCalledWith(mockPayloadPendingStatus);
    });

    it('should extract subscriptionId from invoice lines', async () => {
      await subscriptionService.createSubscriptionHistoryPayment(
        mockInvoicePaid as any,
      );

      // ASSERT: Verify it extracted the string and sent it to the repo property
      expect(
        mockSubscriptionRepository.createSubscriptionPaymentHistory,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: mockInvoicePaid.lines.data[0].subscription,
        }),
      );
    });

    it('should calculate periodStart and periodEnd correctly', async () => {
      await subscriptionService.createSubscriptionHistoryPayment(
        mockInvoicePaid as any,
      );

      expect(
        mockSubscriptionRepository.createSubscriptionPaymentHistory,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          periodStart: new Date(mockInvoicePaid.period_start * 1000),
          periodEnd: new Date(mockInvoicePaid.period_end * 1000),
        }),
      );
    });
  });

  // ============================================
  // getUserPlan tests
  // ============================================
  describe('getUserPlan', () => {
    it('should return plan when subscription exists', async () => {
      mockSubscriptionRepository.findByUserId.mockResolvedValue(
        mockSubscription,
      );

      const result = await subscriptionService.getUserPlan(mockSubscription.id);

      expect(result).toBe(mockSubscription.plan);
    });

    it('should return null when no subscription exists', async () => {
      mockSubscriptionRepository.findByUserId.mockResolvedValue(null);

      const result = await subscriptionService.getUserPlan('user-321');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // isSubscriptionActive tests
  // ============================================
  describe('isSubscriptionActive', () => {
    it('should return true when subscription status is ACTIVE', async () => {
      mockSubscriptionRepository.findByUserId.mockResolvedValue(
        mockSubscription,
      );

      const result = await subscriptionService.isSubscriptionActive(
        mockSubscription.userId,
      );

      expect(result).toBe(true);
    });

    it('should return false when subscription status is CANCELED', async () => {
      const mockSubscriptionCanceled = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELED,
      };

      mockSubscriptionRepository.findByUserId.mockResolvedValue(
        mockSubscriptionCanceled,
      );

      const result = await subscriptionService.isSubscriptionActive(
        mockSubscriptionCanceled.userId,
      );

      expect(result).toBe(false);
    });

    it('should return false when no subscription exists', async () => {
      mockSubscriptionRepository.findByUserId.mockResolvedValueOnce(null);

      const result = await subscriptionService.isSubscriptionActive('user-321');

      expect(result).toBe(false);
    });
  });
});
