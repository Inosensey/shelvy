import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  NotificationEmailMode,
  NotificationType,
} from 'generated/prisma/enums';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { NodemailerService } from 'src/NodemailerConfig/Nodemailer.service';
import { buildDigestEmail } from 'src/mail/templates/notificationDigest.template';
import { notificationUrl } from './notification.links';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;
const BATCH = 500;
const MAX_ITEMS = 10;

type Setting = {
  emailLowStock: boolean;
  emailRequests: boolean;
  emailDecisions: boolean;
  emailMembers: boolean;
} | null;

function typeAllowed(type: NotificationType, s: Setting): boolean {
  switch (type) {
    case NotificationType.PAYMENT_FAILED:
      return true; // billing always sends
    case NotificationType.LOW_STOCK:
      return s?.emailLowStock ?? true;
    case NotificationType.MOVEMENT_REQUESTED:
      return s?.emailRequests ?? true;
    case NotificationType.MOVEMENT_DECIDED:
      return s?.emailDecisions ?? true;
    case NotificationType.MEMBER_JOINED:
      return s?.emailMembers ?? true;
    default:
      return false;
  }
}

@Injectable()
export class NotificationEmailService {
  private readonly logger = new Logger(NotificationEmailService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: NodemailerService,
    private readonly config: ConfigService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweep() {
    if (this.running) return; // don't overlap with a slow run
    this.running = true;
    try {
      await this.processDue();
    } catch (err) {
      this.logger.error(
        `Notification email sweep failed: ${err instanceof Error ? err.message : err}`,
      );
    } finally {
      this.running = false;
    }
  }

  private async processDue() {
    const now = Date.now();
    const delayMinutes = Number(
      this.config.get('NOTIFICATION_EMAIL_DELAY_MINUTES') ?? 5,
    );
    const delayCutoff = new Date(now - delayMinutes * 60_000);

    const rows = await this.prisma.notification.findMany({
      where: {
        isRead: false,
        emailedAt: null,
        createdAt: { gte: new Date(now - MAX_AGE_MS) },
        OR: [
          { type: NotificationType.PAYMENT_FAILED },
          {
            user: {
              notificationSetting: {
                emailMode: NotificationEmailMode.IMMEDIATE,
              },
            },
          },
          {
            createdAt: { lte: delayCutoff },
            user: {
              OR: [
                { notificationSetting: null },
                {
                  notificationSetting: {
                    emailMode: NotificationEmailMode.IF_UNREAD,
                  },
                },
              ],
            },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: BATCH,
      include: { user: { select: { email: true, notificationSetting: true } } },
    });
    if (rows.length === 0) return;

    const byUser = new Map<string, typeof rows>();
    for (const r of rows)
      byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);

    const base = this.config.get<string>('FRONTEND_URL')!;

    for (const [userId, group] of byUser) {
      const { email, notificationSetting } = group[0].user;
      const wanted = group.filter((n) =>
        typeAllowed(n.type, notificationSetting),
      );
      const skipped = group.filter((n) => !wanted.includes(n));

      // handled but not emailed (category switched off), so they aren't picked up again
      if (skipped.length) await this.markEmailed(skipped.map((n) => n.id));
      if (wanted.length === 0) continue;

      try {
        const mail = buildDigestEmail({
          items: wanted.slice(0, MAX_ITEMS).map((n) => ({
            title: n.title,
            message: n.message,
            url: notificationUrl(base, n),
          })),
          total: wanted.length,
          appUrl: `${base}/dashboard`,
          manageUrl: `${base}/dashboard/settings?tab=notifications`,
        });
        await this.mailer.sendEmail(email, mail.subject, mail.html, mail.text);
        await this.markEmailed(wanted.map((n) => n.id));
      } catch (err) {
        // stays unemailed: retried next minute until it is older than a day
        this.logger.error(
          `Notification email for user ${userId} failed: ${err instanceof Error ? err.message : err}`,
        );
      }
    }
  }

  private markEmailed(ids: string[]) {
    return this.prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { emailedAt: new Date() },
    });
  }
}
