// user.repository.ts

import { Injectable } from '@nestjs/common';

// Services
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import {
  CreateUserInfoDTO,
  SaveMemberOnboardingDTO,
  SaveOrgOnboardingDTO,
} from './user.dto';
import { InviteRole } from 'generated/prisma/enums';

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
        organizationId: true,
        subscriptions: {
          select: {
            id: true,
          },
        },
        role: true,
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

  async saveOrgOnboardingInfo(data: SaveOrgOnboardingDTO, userId: string) {
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

  async saveMemberOnboardingInfo(
    payload: SaveMemberOnboardingDTO,
    organizationId: string,
    role: InviteRole,
  ) {
    return this.prisma.$transaction(async (prisma) => {
      const user = await prisma.user.create({
        data: {
          ...payload.credentials,
          organizationId: organizationId,
          role: role,
        },
      });
      const userInfo = await prisma.userInfo.create({
        data: {
          userId: user.id,
          ...payload.userInfo,
          birthDate: payload.userInfo.birthDate
            ? new Date(payload.userInfo.birthDate)
            : null,
        },
      });
      return { user, userInfo };
    });
  }
}
