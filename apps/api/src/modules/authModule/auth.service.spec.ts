import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { AuthRepository } from './auth.repository';
import { Role } from 'generated/prisma/client';

// MOCKS
const mockAuthRepository = {
  createUser: jest.fn(),
  userFindByEmail: jest.fn(),
  createSession: jest.fn(),
  invalidateAllUserSessions: jest.fn(),
  invalidateSession: jest.fn(),
};

const mockSessionService = {
  createSession: jest.fn(),
  validateSession: jest.fn(),
  invalidateSession: jest.fn(),
  invalidateAllUserSessions: jest.fn(),
};

// REUSABLE TEST DATA
const mockCredentials = {
  email: 'test@gmail.com',
  password: 'Test@1234',
};

const mockUser = {
  id: 'user-123',
  email: 'test@gmail.com',
  name: 'Test User',
  password: 'will-be-replaced-with-real-hash',
  role: Role.OWNER,
};
const mockRegisterUser = {
  email: 'test@gmail.com',
  name: 'Test User',
  password: 'Test@1234',
  userType: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockRegisterUserResponse = {
  id: 'user-123',
  email: 'test@gmail.com',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// TEST SUITE
describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(async () => {
    mockUser.password = await bcrypt.hash(mockCredentials.password, 10);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AuthRepository,
          useValue: mockAuthRepository,
        },
        {
          provide: SessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // signIn tests
  describe('signIn', () => {
    it('should throw when user is not found', async () => {
      mockAuthRepository.userFindByEmail.mockResolvedValue(null);

      await expect(authService.signIn(mockCredentials)).rejects.toThrow(
        'Invalid email or password',
      );
    });

    it('should throw when password is wrong', async () => {
      mockAuthRepository.userFindByEmail.mockResolvedValue(mockUser);

      await expect(
        authService.signIn({
          email: 'test@gmail.com',
          password: 'WrongP@ss999',
        }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should invalidate old sessions before signing in', async () => {
      mockAuthRepository.userFindByEmail.mockResolvedValue(mockUser);

      await authService.signIn(mockCredentials);
      expect(mockSessionService.invalidateAllUserSessions).toHaveBeenCalledWith(
        mockUser.id,
      );
    });

    it('should create a new session after signing in', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      mockAuthRepository.userFindByEmail.mockResolvedValue(mockUser);

      await authService.signIn(mockCredentials);

      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String) as string,
        expect.any(Date) as Date,
      );
    });

    it('should return correct data on successful sign in', async () => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      mockAuthRepository.userFindByEmail.mockResolvedValue(mockUser);

      const result = await authService.signIn(mockCredentials);

      expect(mockSessionService.invalidateAllUserSessions).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mockSessionService.createSession).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String) as string,
        expect.any(Date) as Date,
      );
      expect(result).toMatchObject({
        token: expect.any(String) as string,
        userId: mockUser.id,
        email: mockUser.email,
        userType: mockUser.role,
      });
    });
  });

  // signOut tests
  describe('signOut', () => {
    it('should invalidate the session for the given token', async () => {
      const mockToken = 'mock-jwt-token';
      mockAuthRepository.userFindByEmail.mockResolvedValue(mockUser);

      await authService.signOut(mockToken);

      expect(mockSessionService.invalidateSession).toHaveBeenCalledWith(
        mockToken,
      );
    });
  });

  // createUser tests
  describe('createUser', () => {
    it('should call createUser on the repository with hashed password and return with the create user', async () => {
      mockAuthRepository.createUser.mockResolvedValue(mockRegisterUserResponse);

      await authService.createUser(mockRegisterUser);

      expect(mockAuthRepository.createUser).toHaveBeenCalledWith(
        mockRegisterUser,
        expect.not.stringMatching(mockRegisterUser.password),
      );

      const calledWithPassword = (
        mockAuthRepository.createUser.mock.calls[0] as [unknown, string]
      )[1];
      const isHashed = await bcrypt.compare(
        mockRegisterUser.password,
        calledWithPassword,
      );
      expect(isHashed).toBe(true);

      expect(mockRegisterUserResponse).toMatchObject({
        id: mockRegisterUserResponse.id,
        name: mockRegisterUser.name,
        email: mockRegisterUser.email,
        createdAt: expect.any(Date) as Date,
        updatedAt: expect.any(Date) as Date,
      });
    });
  });
});
