import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { OrganizationRepository } from 'src/modules/organizationModule/organization.repository';

@Injectable()
export class InviteCleanupService {
  private readonly logger = new Logger(InviteCleanupService.name);

  constructor(
    private readonly organizationRepository: OrganizationRepository,
  ) {}
  @Cron('0 0 * * *', {
    name: 'session-cleanup',
    timeZone: 'Asia/Singapore',
    waitForCompletion: true,
  })
  async cleanupExpiredSessions() {
    this.logger.log('Starting cleanup of expired invite...');

    const result =
      await this.organizationRepository.deleteExpiredInviteRecord();

    this.logger.log(`Cleaned up ${result.count} expired invites`);
  }
}
