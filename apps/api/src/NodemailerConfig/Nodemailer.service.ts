import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  buildInviteEmail,
  InviteRole,
} from 'src/mail/templates/inviteMember.template';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NodemailerService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly config: ConfigService,
  ) {}

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

      if (this.config.get<string>('MAIL_PROVIDER') === 'brevo') {
        await this.sendViaBrevo(inviteEmailPayload.to, subject, html);
      } else {
        await this.mailerService.sendMail({
          to: inviteEmailPayload.to,
          subject: subject,
          text: text,
          html: html,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(
        `Failed to send invite email: ${message}`,
      );
    }
  }

  private async sendViaBrevo(to: string, subject: string, html: string) {
    const apiKey = this.config.get<string>('MAIL_BREVO_API_KEY');
    if (!apiKey) throw new Error('BREVO_API_KEY is not configured');

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: this.config.get('MAIL_FROM_NAME') as string,
          email: this.config.get('MAIL_FROM_ADDRESS') as string,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(10000), // fail in 10s instead of hanging the request
    });

    if (!res.ok) {
      throw new Error(`Brevo responded ${res.status}: ${await res.text()}`);
    }
  }
}
