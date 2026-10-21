// organization.repository.ts
import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  GoneException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { CreateOrganizationDTO } from './organization.dto';
import { InviteRole, Role } from 'generated/prisma/enums';
import { NodemailerService } from 'src/NodemailerConfig/Nodemailer.service';
import { UserService } from '../usersModule/user.service';

@Injectable()
export class OrganizationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly nodemailerService: NodemailerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

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

  async createOrganizationInviteRecord(inviteRecordPayload: {
    recipientEmail: string;
    role: InviteRole;
    userId: string;
    organizationId: string;
    token: string;
    expiresAt: Date;
  }) {
    return await this.prisma.organizationInvite.create({
      data: {
        email: inviteRecordPayload.recipientEmail.toLowerCase(),
        organizationId: inviteRecordPayload.organizationId,
        role: inviteRecordPayload.role,
        token: inviteRecordPayload.token,
        invitedById: inviteRecordPayload.userId,
        expiresAt: inviteRecordPayload.expiresAt,
      },
    });
  }

  async acceptInvite(token: string, userId: string) {
    const { notification } = await this.prisma.$transaction(async (tx) => {
      const invite = await tx.organizationInvite.findUnique({
        where: { token },
        include: { organization: { select: { ownerId: true } } },
      });
      if (!invite || invite.status !== 'PENDING') {
        throw new NotFoundException(
          'This invitation is invalid or has already been used.',
        );
      }
      if (new Date() > invite.expiresAt)
        throw new GoneException('This invitation link has expired.');

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, organizationId: true },
      });
      if (!user) throw new UnauthorizedException();
      if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
        throw new ForbiddenException(
          'This invitation was sent to a different email address.',
        );
      }
      if (user.organizationId) {
        throw new ConflictException(
          'This account already belongs to an organization.',
        );
      }

      const claimed = await tx.organizationInvite.updateMany({
        where: { id: invite.id, status: 'PENDING' },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      if (claimed.count === 0)
        throw new ConflictException('This invitation has already been used.');

      await tx.user.update({
        where: { id: user.id },
        data: { organizationId: invite.organizationId, role: invite.role },
      });

      const notification = await tx.notification.create({
        data: {
          organizationId: invite.organizationId,
          userId: invite.organization.ownerId,
          type: 'MEMBER_JOINED',
          title: 'New member joined',
          message: `${user.email} accepted your invite.`,
        },
      });

      return { notification };
    });

    return notification;
  }

  async sendInviteEmail(
    inviteRecordPayload: {
      recipientEmail: string;
      role: InviteRole;
      userId: string;
      organizationId: string;
      token: string;
      expiresAt: Date;
    },
    inviteEmailPayload: {
      to: string;
      inviterName: string;
      organizationName: string;
      role: InviteRole;
      inviteUrl: string;
      expiresInDays: number;
    },
  ): Promise<boolean> {
    const existing = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: inviteRecordPayload.recipientEmail,
          mode: 'insensitive',
        },
      },
      select: { organizationId: true },
    });

    if (existing?.organizationId) {
      throw new ConflictException(
        'This email already belongs to an organization.',
      );
    }

    await this.createOrganizationInviteRecord(inviteRecordPayload);

    try {
      await this.nodemailerService.sendInviteEmail(inviteEmailPayload);
    } catch (emailError) {
      await this.prisma.organizationInvite.deleteMany({
        where: { token: inviteRecordPayload.token },
      });
      throw emailError;
    }

    return true;
  }
  async resendInviteEmail(
    inviteRecordUpdatePayload: {
      organizationId: string;
      oldToken: string;
      newToken: string;
      oldExpireDate: Date;
      newExpireDate: Date;
      lastResentAt: Date;
    },
    inviteEmailPayload: {
      to: string;
      inviterName: string;
      organizationName: string;
      role: InviteRole;
      inviteUrl: string;
      expiresInDays: number;
    },
  ) {
    const updatedInviteRecord = await this.updateInviteRecordForResend(
      inviteRecordUpdatePayload,
    );

    try {
      await this.nodemailerService.sendInviteEmail(inviteEmailPayload);
    } catch (emailError) {
      await this.prisma.organizationInvite.update({
        where: {
          token: inviteRecordUpdatePayload.oldToken,
          organizationId: inviteRecordUpdatePayload.organizationId,
        },
        data: {
          token: inviteRecordUpdatePayload.oldToken,
          expiresAt: inviteRecordUpdatePayload.oldExpireDate,
          status: 'REVOKED',
        },
      });
      throw emailError;
    }

    return { updatedInviteRecord };
  }

  async deleteExpiredInviteRecord() {
    return this.prisma.organizationInvite.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  async revokeInviteRecord(token: string, organizationId: string) {
    return await this.prisma.organizationInvite.update({
      where: { token, organizationId },
      data: {
        status: 'REVOKED',
      },
    });
  }

  async removeOrgMember(
    memberId: string,
    organizationId: string,
    requesterId: string,
  ) {
    if (memberId === requesterId) {
      throw new ForbiddenException(
        'You cannot remove yourself from the organization.',
      );
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { ownerId: true },
    });
    if (org?.ownerId === memberId) {
      throw new ForbiddenException('The organization owner cannot be removed.');
    }

    const result = await this.prisma.user.updateMany({
      where: { id: memberId, organizationId },
      data: { organizationId: null, role: Role.STAFF },
    });

    if (result.count === 0) {
      throw new NotFoundException('Member not found in your organization.');
    }
    return memberId;
  }

  async setInviteStatusToAccept(token: string) {
    return await this.prisma.organizationInvite.update({
      where: { token },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    });
  }

  async updateInviteRecordForResend(inviteRecordUpdatePayload: {
    oldToken: string;
    newToken: string;
    newExpireDate: Date;
    lastResentAt: Date;
  }) {
    return await this.prisma.organizationInvite.update({
      where: { token: inviteRecordUpdatePayload.oldToken },
      data: {
        token: inviteRecordUpdatePayload.newToken,
        expiresAt: inviteRecordUpdatePayload.newExpireDate,
        lastResentAt: inviteRecordUpdatePayload.lastResentAt,
        status: 'PENDING',
      },
    });
  }

  async validateInviteToken(token: string) {
    const inviteRecord = await this.prisma.organizationInvite.findUnique({
      where: { token },
      include: {
        organization: { select: { name: true } },
      },
    });

    if (!inviteRecord || inviteRecord.status !== 'PENDING') {
      throw new NotFoundException(
        'This invitation link is invalid or has already been used.',
      );
    }

    if (new Date() > inviteRecord.expiresAt) {
      await this.prisma.organizationInvite.update({
        where: { id: inviteRecord.id },
        data: { status: 'EXPIRED' },
      });
      throw new GoneException('This invitation link has expired.');
    }

    const inviterInfo = await this.userService.getUserInfoById(
      inviteRecord.invitedById,
    );

    const userExists = await this.prisma.user.findUnique({
      where: { email: inviteRecord.email.toLowerCase() },
    });

    return {
      email: inviteRecord.email,
      organizationName: inviteRecord.organization.name,
      inviterName: `${inviterInfo.firstName} ${inviterInfo.lastName}`.trim(),
      role: inviteRecord.role,
      isExistingUser: !!userExists,
      status: inviteRecord.status,
    };
  }

  async getOrgMembersByOrganizationId(organizationId: string) {
    return this.prisma.user.findMany({
      where: {
        organizationId: organizationId,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
        role: true,
        usersInfo: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getInviteRecordsByOrganizationId(organizationId: string) {
    return this.prisma.organizationInvite.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRevokedRecordsByOrganizationId(organizationId: string) {
    return this.prisma.organizationInvite.findMany({
      where: {
        organizationId,
        status: 'REVOKED',
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingInviteRecordsByOrganizationId(organizationId: string) {
    return this.prisma.organizationInvite.findMany({
      where: {
        organizationId,
        status: 'PENDING',
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findInviteRecordByToken(token: string) {
    const record = await this.prisma.organizationInvite.findUnique({
      where: { token },
    });

    if (!record) {
      throw new NotFoundException('Invite record not found.');
    }

    if (record.status === 'EXPIRED') {
      throw new GoneException(
        'This invitation link has already been processed or is no longer valid.',
      );
    }

    if (new Date() > record.expiresAt) {
      await this.prisma.organizationInvite.update({
        where: { id: record.id },
        data: { status: 'REVOKED' },
      });

      throw new GoneException('This invitation link has expired.');
    }

    return record;
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
      include: {
        users: true,
      },
    });
  }
}
