// user service

import { Injectable } from '@nestjs/common';

// Repository
import { UserRepository } from './user.repository';

// Dto's
import { UserResponseDTO } from './user.dto';

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
}
