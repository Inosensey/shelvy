import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AuthRepository } from './auth.repository';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);

  constructor(private readonly authRepository: AuthRepository) {}
  @Cron('0 0 * * *', {
    name: 'session-cleanup',
    timeZone: 'Asia/Singapore',
    waitForCompletion: true,
  })
  async cleanupExpiredSessions() {
    this.logger.log('Starting cleanup of expired sessions...');

    const result = await this.authRepository.deleteExpiredSessions();

    this.logger.log(`Cleaned up ${result.count} expired sessions`);
  }
}
