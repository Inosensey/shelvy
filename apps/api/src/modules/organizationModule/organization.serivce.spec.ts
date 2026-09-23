// organization.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationRepository } from './organization.repository';

// ============================================
// MOCKS
// ============================================
const mockOrganizationRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
};

// ============================================
// REUSABLE TEST DATA
// ============================================
const mockOrg = {
  id: 'org-123',
  name: 'Acme Corp',
  description: 'A company that sells stuff',
  ownerId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCreateOrgDTO = {
  name: 'Acme Corp',
  description: 'A company that sells stuff',
};

const mockUserId = 'user-123';

// ============================================
// TEST SUITE
// ============================================
describe('OrganizationService', () => {
  let organizationService: OrganizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: OrganizationRepository,
          useValue: mockOrganizationRepository,
        },
      ],
    }).compile();

    organizationService = module.get<OrganizationService>(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // createOrganization tests
  // ============================================
  describe('createOrganization', () => {
    it('should throw ConflictException when user already has an organization', async () => {
      mockOrganizationRepository.create.mockRejectedValue(
        new ConflictException('User already belongs to an organization'),
      );

      await expect(
        organizationService.createOrganization(mockCreateOrgDTO, mockUserId),
      ).rejects.toThrow(ConflictException);
    });

    it('should create and return organization when user has no existing one', async () => {
      mockOrganizationRepository.create.mockResolvedValue(mockOrg);

      const result = await organizationService.createOrganization(
        mockCreateOrgDTO,
        mockUserId,
      );

      expect(mockOrganizationRepository.create).toHaveBeenCalledWith(
        mockCreateOrgDTO,
        mockUserId,
      );
      expect(result).toMatchObject(mockOrg);
    });
  });

  // ============================================
  // getMyOrganization tests
  // ============================================
  describe('getMyOrganization', () => {
    it('should return organization when found', async () => {
      mockOrganizationRepository.findByUserId.mockResolvedValue(mockOrg);

      const result = await organizationService.getMyOrganization(mockUserId);

      expect(result).toMatchObject(mockOrg);
    });

    it('should return null when no organization found', async () => {
      mockOrganizationRepository.findByUserId.mockResolvedValue(null);

      const result = await organizationService.getMyOrganization(mockUserId);

      expect(result).toBe(null);
    });
  });
});
