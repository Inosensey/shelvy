// user.repository.ts

import { Injectable } from '@nestjs/common';

// Services
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { CreateUserInfoDTO, SaveOnboardingDTO } from './user.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        subscriptions: {
          select: {
            id: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findUserInfoById(userId: string) {
    return this.prisma.userInfo.findUniqueOrThrow({
      where: { userId },
    });
  }

  async getStripeCustomerId(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    return user.stripeCustomerId;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateStripeCustomerId(userId: string, stripeCustomerId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  async createUserInfo(data: CreateUserInfoDTO, userId: string) {
    return this.prisma.userInfo.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async saveOnboardingInfo(data: SaveOnboardingDTO, userId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // Create user info
      const userInfo = await prisma.userInfo.create({
        data: {
          userId,
          ...data.userInfo,
        },
      });

      const organization = await prisma.organization.create({
        data: {
          ownerId: userId,
          ...data.organization,
          users: {
            connect: { id: userId },
          },
        },
      });

      return { userInfo, organization };
    });
  }
}
