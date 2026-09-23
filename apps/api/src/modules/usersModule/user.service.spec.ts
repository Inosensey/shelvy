// user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

// ============================================
// MOCKS
// ============================================
const mockUserRepository = {
  findById: jest.fn(),
  findUserInfoById: jest.fn(),
  getStripeCustomerId: jest.fn(),
  findByEmail: jest.fn(),
  updateStripeCustomerId: jest.fn(),
  createUserInfo: jest.fn(),
  saveOnboardingInfo: jest.fn(),
};

// ============================================
// REUSABLE TEST DATA
// ============================================
const mockUser = {
  id: 'user-123',
  email: 'test@gmail.com',
  stripeCustomerId: 'cus_test_123',
  subscriptions: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockUserInfo = {
  id: 1,
  userId: 'user-123',
  firstName: 'John',
  middleName: null,
  lastName: 'Doe',
  suffix: null,
  birthDate: null,
  gender: null,
  phone: null,
  address: null,
  city: null,
  state: null,
  country: null,
  postalCode: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrg = {
  id: 'org-123',
  name: 'Acme Corp',
  description: null,
  ownerId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCreateUserInfoDTO = {
  firstName: 'John',
  lastName: 'Doe',
};

const mockCreateOrgDTO = {
  name: 'Acme Corp',
};

const mockSaveOnboardingDTO = {
  userInfo: mockCreateUserInfoDTO,
  organization: mockCreateOrgDTO,
};

const mockUserId = 'user-123';

// ============================================
// TEST SUITE
// ============================================
describe('UserService', () => {
  let userService: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // getStripeCustomerId tests
  // ============================================
  describe('getStripeCustomerId', () => {
    it('should return stripeCustomerId when user exists', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getStripeCustomerId(mockUserId);

      expect(result).toBe(mockUser.stripeCustomerId);
    });

    it('should return null when stripeCustomerId is null', async () => {
      const mockUserStripeIdNull = {
        id: 'user-321',
        email: 'test123@gmail.com',
        stripeCustomerId: null,
        subscriptions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUserRepository.findById.mockResolvedValue(mockUserStripeIdNull);

      const result = await userService.getStripeCustomerId(
        mockUserStripeIdNull.id,
      );

      expect(result).toBe(null);
    });
  });

  // ============================================
  // saveOnboardingInfo tests
  // ============================================
  describe('saveOnboardingInfo', () => {
    it('should return userInfo and organization on success', async () => {
      const mockSaveOnboardingResponse = {
        organization: mockOrg,
        userInfo: mockUserInfo,
      };

      mockUserRepository.saveOnboardingInfo.mockResolvedValue(
        mockSaveOnboardingResponse,
      );

      const result = await userService.saveOnboardingInfo(
        mockSaveOnboardingDTO,
        mockUserId,
      );

      expect(result).toMatchObject(mockSaveOnboardingResponse);
    });
  });
});
