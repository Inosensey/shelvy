// auth.repository.ts

import { Injectable } from '@nestjs/common';

// Services
import { PrismaService } from 'src/PrismaConfig/prisma.service';

// DTO
import { LoginDTO } from './auth.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput, hashedPassword: string) {
    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserStripeCustomerId(userId: string, stripeCustomerId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  async userFindByEmail(credentials: LoginDTO) {
    return this.prisma.user.findUnique({
      where: { email: credentials.email },
    });
  }

  async userFindById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async createSession(userId: string, token: string, expiresAt: Date) {
    return this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        isValid: true,
      },
    });
  }
  async getSessionByToken(token: string) {
    return this.prisma.session.findUnique({
      where: { token },
    });
  }

  async validateSession(token: string) {
    return await this.prisma.session.findUnique({
      where: { token },
    });
  }
  async invalidateSession(token: string): Promise<void> {
    await this.prisma.session.update({
      where: { token },
      data: { isValid: false },
    });
  }
  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, isValid: true },
      data: { isValid: false },
    });
  }

  async deleteExpiredSessions() {
    return await this.prisma.session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isValid: false }],
      },
    });
  }
}
