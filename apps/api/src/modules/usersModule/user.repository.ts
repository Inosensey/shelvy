// user.repository.ts

import { Injectable } from '@nestjs/common';

// Services
import { PrismaService } from 'src/PrismaConfig/prisma.service';

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
}
