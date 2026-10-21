// organization.service.ts
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationRepository } from './organization.repository';
import {
  CreateOrganizationDTO,
  SendInviteEmailDTO,
  ValidateInviteResponseDTO,
} from './organization.dto';
import { NodemailerService } from 'src/NodemailerConfig/Nodemailer.service';
import { UserService } from '../usersModule/user.service';
import { ConfigService } from '@nestjs/config';
import { differenceInHours } from 'date-fns';
import { AuthenticatedRequest } from 'src/types/request';
import { NotificationService } from '../notificationModule/notification.service';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly orgRepo: OrganizationRepository,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private configService: ConfigService,
    private readonly nodemailerService: NodemailerService,
    private readonly notificationService: NotificationService,
  ) {}

  assertOwnerOrg(req: AuthenticatedRequest) {
    if (!req.user.organizationId) {
      throw new ForbiddenException(
        'Forbidden access resource permissions error',
      );
    }
  }

  async createOrganization(data: CreateOrganizationDTO, userId: string) {
    return this.orgRepo.create(data, userId);
  }

  async sendInviteEmail(data: SendInviteEmailDTO, ownerId: string) {
    const organization = await this.orgRepo.findByUserId(ownerId);
    const ownerInfo = await this.userService.getUserInfoById(ownerId);
    const ownerFullName = `${ownerInfo.firstName} (${ownerInfo.lastName})`;
    const token = this.nodemailerService.generateInviteToken();
    const tokenDurationDays = 7; // Token valid for 7 days
    const inviteUrl = `${this.configService.get('FRONTEND_URL')}/invite/member?token=${token}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + tokenDurationDays);

    const inviteRecordPayload = {
      recipientEmail: data.recipientEmail,
      role: data.role,
      userId: ownerId,
      organizationId: organization!.id,
      token: token,
      expiresAt: expiresAt,
    };

    const sendInvitePayload = {
      to: data.recipientEmail,
      inviterName: ownerFullName,
      organizationName: organization!.name,
      role: data.role,
      inviteUrl: inviteUrl,
      expiresInDays: tokenDurationDays,
    };

    await this.orgRepo.sendInviteEmail(inviteRecordPayload, sendInvitePayload);
  }

  async resendInvite(token: string, organizationId: string) {
    const inviteRecord = await this.orgRepo.findInviteRecordByToken(token);
    const newToken = this.nodemailerService.generateInviteToken();
    const newExpireDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (!inviteRecord) {
      throw new NotFoundException('Invite not found.');
    }

    const referenceTime = inviteRecord.lastResentAt ?? inviteRecord.createdAt;
    const hoursSinceLastSend = differenceInHours(new Date(), referenceTime);

    if (hoursSinceLastSend < 24) {
      const hoursRemaining = 24 - hoursSinceLastSend;

      throw new BadRequestException(
        `This invite was already resent recently. Try again in ${hoursRemaining} hour${hoursRemaining === 1 ? '' : 's'}.`,
      );
    }

    const organization = await this.orgRepo.findByUserId(
      inviteRecord.invitedById,
    );
    const ownerInfo = await this.userService.getUserInfoById(
      inviteRecord.invitedById,
    );
    const ownerFullName = `${ownerInfo.firstName} (${ownerInfo.lastName})`;
    const inviteUrl = `${this.configService.get('FRONTEND_URL')}/invite/member?token=${newToken}`;

    const inviteRecordUpdatePayload = {
      organizationId,
      oldToken: inviteRecord.token,
      newToken,
      oldExpireDate: inviteRecord.expiresAt,
      newExpireDate,
      lastResentAt: new Date(Date.now()),
    };
    const sendInvitePayload = {
      to: inviteRecord.email,
      inviterName: ownerFullName,
      organizationName: organization!.name,
      role: inviteRecord.role,
      inviteUrl: inviteUrl,
      expiresInDays: 7,
    };

    const { updatedInviteRecord } = await this.orgRepo.resendInviteEmail(
      inviteRecordUpdatePayload,
      sendInvitePayload,
    );

    return updatedInviteRecord;
  }

  async acceptInvite(token: string, userId: string) {
    const notification = await this.orgRepo.acceptInvite(token, userId);

    await this.notificationService.createAndEmit(notification);

    return true;
  }

  async removeOrgMember(
    memberId: string,
    organizationId: string,
    requesterId: string,
  ) {
    return this.orgRepo.removeOrgMember(memberId, organizationId, requesterId);
  }

  async revokeInvite(token: string, organizationId: string) {
    return this.orgRepo.revokeInviteRecord(token, organizationId);
  }

  async setInviteStatusToAccept(token: string) {
    return this.orgRepo.setInviteStatusToAccept(token);
  }

  async validateInviteToken(token: string): Promise<ValidateInviteResponseDTO> {
    return this.orgRepo.validateInviteToken(token);
  }

  async getOrganizationById(id: string) {
    return this.orgRepo.findById(id);
  }

  async getMyOrganization(userId: string) {
    return this.orgRepo.findByUserId(userId);
  }

  async findInviteRecordByToken(token: string) {
    return this.orgRepo.findInviteRecordByToken(token);
  }

  async getOrgMembersByOrganizationId(organizationId: string) {
    return this.orgRepo.getOrgMembersByOrganizationId(organizationId);
  }

  async getInviteRecordsByOrganizationId(organizationId: string) {
    return this.orgRepo.getInviteRecordsByOrganizationId(organizationId);
  }

  async getRevokedInviteRecordsByOrganizationId(organizationId: string) {
    return this.orgRepo.getRevokedRecordsByOrganizationId(organizationId);
  }

  async getPendingInviteRecordsByOrganizationId(organizationId: string) {
    return this.orgRepo.getPendingInviteRecordsByOrganizationId(organizationId);
  }
}
