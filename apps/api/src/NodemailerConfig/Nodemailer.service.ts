import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  buildInviteEmail,
  InviteRole,
} from 'src/mail/templates/inviteMember.template';
import * as crypto from 'crypto';

@Injectable()
export class NodemailerService {
  constructor(private readonly mailerService: MailerService) {}

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: to,
        subject: 'Welcome to Our Platform!',
        text: `Hello ${name}, welcome aboard!`,
        html: `<b>Hello ${name},</b><br>Welcome aboard!`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to send email: ${message}`,
      );
    }
  }

  generateInviteToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
  };

  async sendInviteEmail(inviteEmailPayload: {
    to: string;
    inviterName: string;
    organizationName: string;
    role: InviteRole;
    inviteUrl: string;
    expiresInDays: number;
  }): Promise<void> {
    try {
      const { subject, html, text } = buildInviteEmail({
        inviterName: inviteEmailPayload.inviterName,
        organizationName: inviteEmailPayload.organizationName,
        role: inviteEmailPayload.role,
        inviteUrl: inviteEmailPayload.inviteUrl,
        expiresInDays: inviteEmailPayload.expiresInDays,
      });

      await this.mailerService.sendMail({
        to: inviteEmailPayload.to,
        subject: subject,
        text: text,
        html: html,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to send invite email: ${message}`,
      );
    }
  }
}
