// user service

import { Injectable } from '@nestjs/common';

// Repository
import { UserRepository } from './user.repository';

// Dto's
import {
  CreateUserInfoDTO,
  SaveOnboardingDTO,
  UserInfoResponseDTO,
  UserResponseDTO,
} from './user.dto';
import { OrganizationResponseDTO } from '../organizationModule/organization.dto';

@Injectable()
export class UserService {
  constructor(private readonly UserRepo: UserRepository) {}

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

  async saveOnboardingInfo(
    data: SaveOnboardingDTO,
    userId: string,
  ): Promise<{
    organization: OrganizationResponseDTO;
    userInfo: UserInfoResponseDTO;
  }> {
    return await this.UserRepo.saveOnboardingInfo(data, userId);
  }
}
