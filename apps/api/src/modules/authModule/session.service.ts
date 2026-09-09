// src/modules/user/session.service.ts
import { Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';

@Injectable()
export class SessionService {
  constructor(private readonly authRepository: AuthRepository) {}

  async createSession(userId: string, token: string, expiresAt: Date) {
    return this.authRepository.createSession(userId, token, expiresAt);
  }

  async getSessionByToken(token: string) {
    return this.authRepository.getSessionByToken(token);
  }

  async validateSession(token: string): Promise<boolean> {
    const session = await this.authRepository.validateSession(token);

    if (!session) return false;
    if (!session.isValid) return false;
    if (session.expiresAt < new Date()) return false;

    return true;
  }

  async invalidateSession(token: string): Promise<void> {
    await this.authRepository.invalidateSession(token);
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.authRepository.invalidateAllUserSessions(userId);
  }
}
