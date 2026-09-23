/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// stripe.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import { StripeRepository } from './stripe.repository';
import { AuthService } from '../authModule/auth.service';
import { SubscriptionService } from '../subscriptionModule/subscription.service';
import { UserService } from '../usersModule/user.service';
import {
  AuthProvider,
  Role,
  SubscriptionPlan,
  SubscriptionStatus,
} from 'generated/prisma/client';

// ============================================
// MOCKS
// ============================================
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  subscriptions: {
    retrieve: jest.fn(),
    update: jest.fn(),
    cancel: jest.fn(),
  },
  customers: {
    create: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

const mockStripeRepository = {
  createCustomer: jest.fn(),
  updateCustomerShelvyId: jest.fn(),
};

const mockAuthService = {
  createUser: jest.fn(),
  getUserById: jest.fn(),
  updateUserStripeCustomerId: jest.fn(),
};

const mockSubscriptionService = {
  createSubscription: jest.fn(),
  getSubscriptionByStripeId: jest.fn(),
  updateStatus: jest.fn(),
  updatePaymentDatesAndFailedAttempts: jest.fn(),
  createSubscriptionHistoryPayment: jest.fn(),
  cancelSubscription: jest.fn(),
};

const mockUserService = {
  getStripeCustomerId: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3001'),
};

// ============================================
// REUSABLE TEST DATA
// ============================================
const mockSession = {
  mode: 'subscription',
  id: 'cs_test_123',
  customer: 'cus_test_123',
  subscription: 'sub_test_123',
  payment_status: 'paid',
  metadata: {
    userId: null,
    email: 'test@gmail.com',
    password: 'hashedpassword123',
    plan: 'premium',
  },
};
const mockSessionWithUser = {
  ...mockSession,
  metadata: {
    ...mockSession.metadata,
    userId: 'user-123', // ← existing user
  },
};

const mockUser = {
  id: 'user-123',
  email: 'test@gmail.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockStripeSubscription = {
  id: 'sub_test_123',
  customer: 'cus_test_123',
  items: {
    data: [
      {
        price: { id: 'price_premium_123' },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 2592000,
      },
    ],
  },
};

const newMockSubscription = {
  userId: mockUser.id,
  plan: SubscriptionPlan.PREMIUM,
  status: SubscriptionStatus.ACTIVE,
  stripeSubscriptionId: mockSession.id,
  stripeCustomerId: mockSession.customer,
  stripePriceId: mockStripeSubscription.items.data[0].price.id,
  currentPeriodStart: expect.any(Date),
  currentPeriodEnd: expect.any(Date),
  nextPaymentDate: expect.any(Date),
};

const newMockUser = {
  email: mockSession.metadata.email,
  authProvider: AuthProvider.LOCAL,
  subscriptionPlan: SubscriptionPlan.PREMIUM,
  stripeCustomerId: mockSession.customer,
  password: mockSession.metadata.password,
  role: Role.OWNER,
};

// ============================================
// TEST SUITE
// ============================================
describe('StripeService', () => {
  let stripeService: StripeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        { provide: 'STRIPE_CLIENT', useValue: mockStripe },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: StripeRepository, useValue: mockStripeRepository },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    stripeService = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // handleCheckoutSessionCompleted tests
  // ============================================
  describe('handleCheckoutSessionCompleted', () => {
    beforeEach(() => {
      // Both scenarios need the stripe subscription retrieved
      mockStripe.subscriptions.retrieve.mockResolvedValue(
        mockStripeSubscription,
      );
    });

    // ✅ DONE — use as template
    it('should create a new user when userId is null', async () => {
      // ARRANGE — no userId in metadata
      mockAuthService.createUser.mockResolvedValue(mockUser);
      mockAuthService.getUserById.mockResolvedValue(null);

      // ACT
      await stripeService.handleCheckoutSessionCompleted(
        mockSessionWithUser as any,
      );

      // ASSERT
      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@gmail.com',
          role: 'OWNER',
        }),
        true, // passwordAlreadyHashed
      );
    });

    // ❌ YOUR TURN
    // Hint: new user created → should also update Stripe customer metadata
    // Hint: mockStripeRepository.updateCustomerShelvyId should be called
    it('should update Stripe customer metadata with new userId', async () => {
      mockAuthService.createUser.mockResolvedValue(mockUser);

      await stripeService.handleCheckoutSessionCompleted(mockSession as any);

      expect(mockAuthService.getUserById).not.toHaveBeenCalled();

      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockSession.metadata.email,
          authProvider: newMockUser.authProvider,
          subscriptionPlan: newMockUser.subscriptionPlan,
          stripeCustomerId: newMockUser.stripeCustomerId,
          password: mockSession.metadata.password,
          role: newMockUser.role,
        }),
        true,
      );

      expect(mockStripeRepository.updateCustomerShelvyId).toHaveBeenCalledWith(
        mockSession.customer,
        mockUser.id,
      );
    });

    // ❌ YOUR TURN
    // Hint: new user created → subscription should be created
    // Hint: mockSubscriptionService.createSubscription should be called
    // Hint: check plan is PREMIUM
    it('should create subscription for new user (premium)', async () => {
      const premiumSession = {
        ...mockSession,
        metadata: { ...mockSession.metadata, plan: 'premium' },
      };

      mockAuthService.createUser.mockResolvedValue(mockUser);

      await stripeService.handleCheckoutSessionCompleted(mockSession as any);

      expect(mockAuthService.getUserById).not.toHaveBeenCalled();

      expect(mockAuthService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockSession.metadata.email,
          authProvider: newMockUser.authProvider,
          subscriptionPlan: newMockUser.subscriptionPlan,
          stripeCustomerId: newMockUser.stripeCustomerId,
          password: mockSession.metadata.password,
          role: newMockUser.role,
        }),
        true,
      );

      expect(mockStripeRepository.updateCustomerShelvyId).toHaveBeenCalledWith(
        mockSession.customer,
        mockUser.id,
      );

      expect(mockSubscriptionService.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          ...newMockSubscription,
          plan:
            premiumSession.metadata.plan === 'premium'
              ? SubscriptionPlan.PREMIUM
              : SubscriptionPlan.ENTERPRISE,
        }),
      );
    });

    // ❌ YOUR TURN
    // Hint: set userId in metadata → mockAuthService.getUserById returns mockUser
    // Hint: should NOT call createUser
    // Hint: should call updateUserStripeCustomerId instead
    it('should update existing user stripeCustomerId when userId exists', async () => {
      mockAuthService.getUserById.mockResolvedValue(mockUser);

      await stripeService.handleCheckoutSessionCompleted(
        mockSessionWithUser as any,
      );

      expect(mockAuthService.createUser).not.toHaveBeenCalled();

      expect(mockAuthService.updateUserStripeCustomerId).toHaveBeenCalledWith(
        mockUser.id,
        mockSession.customer,
      );
    });

    // ❌ YOUR TURN
    // Hint: same setup as above
    // Hint: createSubscription should still be called for existing user too
    it('should create subscription for existing user', async () => {
      mockAuthService.getUserById.mockResolvedValue({ id: 'user_123' });

      await stripeService.handleCheckoutSessionCompleted(mockSession as any);

      expect(mockStripeRepository.createCustomer).not.toHaveBeenCalled();

      expect(mockSubscriptionService.createSubscription).toHaveBeenCalledWith(
        expect.objectContaining(newMockSubscription),
      );
    });

    // ❌ YOUR TURN
    // Hint: set session.mode to 'payment' instead of 'subscription'
    // Hint: nothing should be called
    it('should do nothing when session mode is not subscription', async () => {
      const nonSubscriptionSession = {
        ...mockSession,
        mode: 'payment',
      };

      const result = await stripeService.handleCheckoutSessionCompleted(
        nonSubscriptionSession as any,
      );

      expect(result).toBeUndefined();

      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
      expect(mockAuthService.getUserById).not.toHaveBeenCalled();
      expect(mockAuthService.createUser).not.toHaveBeenCalled();
      expect(mockSubscriptionService.createSubscription).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // createSubscriptionCheckoutSession tests
  // ============================================
  describe('createSubscriptionCheckoutSession', () => {
    // ✅ DONE — use as template
    it('should return sessionId and url', async () => {
      // ARRANGE
      mockStripeRepository.createCustomer.mockResolvedValue({
        id: 'cus_new_123',
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });
      mockUserService.getStripeCustomerId.mockResolvedValue(null);

      // ACT
      const result = await stripeService.createSubscriptionCheckoutSession(
        { email: 'test@gmail.com', password: 'Test@1234' },
        'premium',
        'price_premium_123',
        'user-123',
      );

      // ASSERT
      expect(result).toMatchObject({
        sessionId: expect.any(String),
        url: expect.any(String),
      });
    });

    // ❌ YOUR TURN
    // Hint: check metadata.password is NOT the plain text password
    // Hint: similar to the bcrypt test we did in AuthService
    it('should hash password before storing in metadata', async () => {
      const mockDto = {
        email: 'test@example.com',
        password: 'plainPassword123',
      };

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'sess_123',
        url: '...',
      });
      jest
        .spyOn(stripeService, 'getOrCreateStripeCustomer')
        .mockResolvedValue('cust_321');

      await stripeService.createSubscriptionCheckoutSession(
        mockDto,
        'premium',
        'price_123',
        'user_123',
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            password: expect.stringMatching(
              /^\$2[ayb]\$\d{2}\$[./A-Za-z0-9]{53}$/,
            ),
          }),
        }),
      );
    });

    // ❌ YOUR TURN
    // Hint: mockUserService.getStripeCustomerId returns null
    // Hint: mockStripeRepository.createCustomer should be called
    it('should create new Stripe customer when user has no existing one', async () => {
      mockUserService.getStripeCustomerId.mockResolvedValue(null); // ← no existing customer
      mockStripeRepository.createCustomer.mockResolvedValue({
        id: 'cus_new_123',
      });
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      await stripeService.createSubscriptionCheckoutSession(
        { email: 'test@gmail.com', password: 'Test@1234' },
        'premium',
        'price_premium_123',
        'user-123',
      );

      expect(mockStripeRepository.createCustomer).toHaveBeenCalled();
    });

    // ❌ YOUR TURN
    // Hint: mockUserService.getStripeCustomerId returns existing 'cus_existing_123'
    // Hint: mockStripeRepository.createCustomer should NOT be called
    it('should reuse existing Stripe customer when user already has one', async () => {
      mockUserService.getStripeCustomerId.mockResolvedValue('cus_existing_123');
      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      await stripeService.createSubscriptionCheckoutSession(
        { email: 'test@gmail.com', password: 'Test@1234' },
        'premium',
        'price_premium_123',
        'user-123',
      );

      expect(mockStripeRepository.createCustomer).not.toHaveBeenCalled();
    });
  });
});
