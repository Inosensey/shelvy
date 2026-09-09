// auth service

import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

// Repo
import { AuthRepository } from './auth.repository';

// Dto's
import { LoginDTO } from './auth.dto';

// Types
import { SessionService } from './session.service';
import { UserResponseDTO } from '../usersModule/user.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly session: SessionService,
    private readonly authRepository: AuthRepository,
  ) {}

  async createUser(
    data: Prisma.UserCreateInput,
    passwordAlreadyHashed: boolean = false,
  ): Promise<UserResponseDTO> {
    const hashedPassword = passwordAlreadyHashed
      ? data.password!
      : await bcrypt.hash(data.password!, 10);

    const user = await this.authRepository.createUser(data, hashedPassword);

    const response: UserResponseDTO = {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return response;
  }

  async updateUserStripeCustomerId(
    userId: string,
    stripeCustomerId: string,
  ): Promise<void> {
    await this.authRepository.updateUserStripeCustomerId(
      userId,
      stripeCustomerId,
    );
  }

  async getUserById(id: string): Promise<UserResponseDTO | null> {
    return await this.authRepository.userFindById(id);
  }

  async signIn(credentials: LoginDTO): Promise<{
    token: string;
    userId: string;
    email: string;
    userType: string;
  }> {
    const user = await this.authRepository.userFindByEmail(credentials);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordIsValid = await bcrypt.compare(
      credentials.password,
      user.password!,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.session.invalidateAllUserSessions(user.id);

    // Create JWT token
    const token = this.generateJwtToken(user.id, 'user');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.session.createSession(user.id, token, expiresAt);

    return {
      token,
      userId: user.id,
      email: user.email,
      userType: 'user',
    };
  }

  async signOut(token: string): Promise<void> {
    await this.session.invalidateSession(token);
  }

  private generateJwtToken(userId: string, userType: string): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(
      {
        userId,
        userType,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
  }
}
