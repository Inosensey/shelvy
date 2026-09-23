// organization.repository.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { CreateOrganizationDTO } from './organization.dto';

@Injectable()
export class OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrganizationDTO, userId: string) {
    const existingOrg = await this.prisma.organization.findFirst({
      where: {
        users: {
          some: { id: userId },
        },
      },
    });

    if (existingOrg) {
      throw new ConflictException('User already belongs to an organization');
    }

    return this.prisma.organization.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        ownerId: userId,
        users: {
          connect: { id: userId },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.organization.findUniqueOrThrow({
      where: { id },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.organization.findFirst({
      where: {
        users: {
          some: { id: userId },
        },
      },
    });
  }
}
