// user.repository.ts

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Services
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import {
  CreateUserInfoDTO,
  SaveMemberOnboardingDTO,
  SaveOrgOnboardingDTO,
} from './user.dto';
import { InviteRole } from 'generated/prisma/enums';
import { ChangePasswordDTO, UpdateProfileDTO } from './settings.dto';

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

  async updateUserInfo(userId: string, data: UpdateProfileDTO) {
    const payload = {
      firstName: data.firstName,
      middleName: data.middleName ?? null,
      lastName: data.lastName,
      suffix: data.suffix ?? null,
      phone: data.phone ?? null,
    };
    return this.prisma.userInfo.upsert({
      where: { userId },
      update: payload,
      create: { userId, ...payload },
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        phone: true,
      },
    });
  }

  async securityInfo(userId: string) {
    const [user, activeSessions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { authProvider: true, password: true },
      }),
      this.prisma.session.count({
        where: { userId, isValid: true, expiresAt: { gt: new Date() } },
      }),
    ]);
    if (!user) throw new NotFoundException('User not found.');
    return {
      authProvider: user.authProvider,
      hasPassword: !!user.password,
      activeSessions,
    };
  }

  async updatePassword(
    userId: string,
    currentToken: string,
    dto: ChangePasswordDTO,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });
    if (!user) throw new NotFoundException('User not found.');
    if (!user.password) {
      throw new BadRequestException(
        'Your account signs in with Google or GitHub, so it has no password to change.',
      );
    }
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect.');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'Your new password must be different from the current one.',
      );
    }

    const hash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { password: hash },
      }),
      this.prisma.session.updateMany({
        where: { userId, isValid: true, token: { not: currentToken } },
        data: { isValid: false },
      }),
    ]);
  }
}
