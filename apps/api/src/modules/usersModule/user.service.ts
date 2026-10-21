import * as bcrypt from 'bcryptjs';

// user service
import { ForbiddenException, Injectable } from '@nestjs/common';

// Repository
import { UserRepository } from './user.repository';

// Dto's
import {
  CreateUserInfoDTO,
  SaveMemberOnboardingDTO,
  SaveOrgOnboardingDTO,
  UserInfoResponseDTO,
  UserResponseDTO,
} from './user.dto';
import { OrganizationResponseDTO } from '../organizationModule/organization.dto';
import { RegisterMemberDTO } from '../authModule/auth.dto';
import { OrganizationService } from '../organizationModule/organization.service';
// import { NotificationGateway } from 'src/socketGateway/notification.gateway';
import { NotificationService } from '../notificationModule/notification.service';
import { CreateNotificationDTO } from '../notificationModule/notification.dto';
import { NotificationType } from 'generated/prisma/enums';
import { AuthenticatedRequest } from 'src/types/request';

@Injectable()
export class UserService {
  constructor(
    private readonly UserRepo: UserRepository,
    private readonly OrgService: OrganizationService,
    private readonly notificationService: NotificationService,
  ) {}

  assertUser(id: string, req: AuthenticatedRequest) {
    if (id !== req.user.userId) {
      throw new ForbiddenException(
        'Forbidden access resource permissions error.',
      );
    }
  }

  async getUserById(id: string): Promise<UserResponseDTO> {
    return await this.UserRepo.findById(id);
  }

  async getStripeCustomerId(userId: string): Promise<string | null> {
    const user = await this.UserRepo.findById(userId);
    return user.stripeCustomerId;
  }

  async getUserInfoById(userId: string): Promise<UserInfoResponseDTO> {
    return await this.UserRepo.findUserInfoById(userId);
  }

  async createUserInfo(
    data: CreateUserInfoDTO,
    userId: string,
  ): Promise<UserInfoResponseDTO> {
    return await this.UserRepo.createUserInfo(data, userId);
  }

  async saveOrgOnboardingInfo(
    data: SaveOrgOnboardingDTO,
    userId: string,
  ): Promise<{
    organization: OrganizationResponseDTO;
    userInfo: UserInfoResponseDTO;
  }> {
    return await this.UserRepo.saveOrgOnboardingInfo(data, userId);
  }

  async saveMemberOnboardingInfo(data: {
    token: string;
    password: string;
    userInfo: CreateUserInfoDTO;
  }) {
    const inviteRecord = await this.OrgService.findInviteRecordByToken(
      data.token,
    );
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const credentials: RegisterMemberDTO = {
      email: inviteRecord.email,
      password: hashedPassword,
    };

    const payload: SaveMemberOnboardingDTO = {
      credentials,
      userInfo: data.userInfo,
    };

    const memberOnboardingResult = await this.UserRepo.saveMemberOnboardingInfo(
      payload,
      inviteRecord.organizationId,
      inviteRecord.role,
    );

    const notificationPayload: CreateNotificationDTO = {
      message: `${inviteRecord.email} has joined your organization!`,
      organizationId: inviteRecord.organizationId,
      title: 'New member joined',
      type: NotificationType.MEMBER_JOINED,
      userId: inviteRecord.invitedById,
    };

    await this.OrgService.setInviteStatusToAccept(data.token);

    await this.notificationService.createAndEmit(notificationPayload);

    return memberOnboardingResult;
  }
}
