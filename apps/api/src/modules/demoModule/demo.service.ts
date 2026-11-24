import { Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
// Adjust to wherever your PrismaService lives.
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { DEMO, DemoRole, PRODUCTS, SUPPLIERS } from './demo.data';
import { generateHistory } from './demo.history';

const DAY = 86_400_000;
const CHUNK = 500;
const PLAN_AMOUNT = 9; // USD per month shown in the demo's billing history. Match your Premium price.

const productId = (sku: string) => `demo-prod-${sku}`;
const supplierId = (i: number) => `demo-sup-${i}`;
const userId = (role: DemoRole) => DEMO.users[role].id;

function chunks<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);
  private inflight: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  /** Reset only if the demo data is older than `maxAgeMs`. Safe to call on every demo sign-in. */
  async resetIfStale(maxAgeMs = DAY): Promise<void> {
    const org = await this.prisma.organization.findUnique({
      where: { id: DEMO.orgId },
      select: { updatedAt: true },
    });
    if (org && Date.now() - org.updatedAt.getTime() < maxAgeMs) return;
    await this.reset();
  }

  /** Wipe and rebuild the demo workspace. Concurrent callers share one run. */
  reset(): Promise<void> {
    this.inflight ??= this.run().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async run(): Promise<void> {
    const password = process.env.DEMO_PASSWORD;
    if (!password || password.length < 12) {
      throw new Error('DEMO_PASSWORD must be set (12+ characters).');
    }
    const started = Date.now();
    const now = new Date();
    const hash = await bcrypt.hash(password, 10);
    const history = generateHistory(now);
    const orgId = DEMO.orgId;
    const roles = Object.keys(DEMO.users) as DemoRole[];

    await this.prisma.$transaction(
      async (tx) => {
        // Serialise resets across instances.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(727274)`;

        // ---- wipe business data (children first) ----
        await tx.notification.deleteMany({ where: { organizationId: orgId } });
        await tx.stockMovementRequest.deleteMany({
          where: { organizationId: orgId },
        });
        await tx.stockMovement.deleteMany({ where: { organizationId: orgId } });
        await tx.product.deleteMany({ where: { organizationId: orgId } });
        await tx.supplier.deleteMany({ where: { organizationId: orgId } });
        await tx.organizationInvite.deleteMany({
          where: { organizationId: orgId },
        });
        await tx.session.deleteMany({
          where: { userId: { in: roles.map(userId) }, expiresAt: { lt: now } },
        });

        // ---- users (owner first: the organization needs it) ----
        for (const role of ['OWNER', 'MANAGER', 'STAFF'] as const) {
          const u = DEMO.users[role];
          await tx.user.upsert({
            where: { id: u.id },
            create: {
              id: u.id,
              email: u.email,
              password: hash,
              role,
              subscriptionPlan: 'PREMIUM',
            },
            update: {
              email: u.email,
              password: hash,
              role,
              subscriptionPlan: 'PREMIUM',
            },
          });
          await tx.userInfo.upsert({
            where: { userId: u.id },
            create: {
              userId: u.id,
              firstName: u.firstName,
              lastName: u.lastName,
            },
            update: { firstName: u.firstName, lastName: u.lastName },
          });
          await tx.notificationSetting.upsert({
            where: { userId: u.id },
            create: { userId: u.id, emailMode: 'OFF' },
            update: { emailMode: 'OFF' },
          });
        }

        await tx.organization.upsert({
          where: { id: orgId },
          create: {
            id: orgId,
            ownerId: userId('OWNER'),
            name: DEMO.orgName,
            description: DEMO.orgDescription,
          },
          update: { name: DEMO.orgName, description: DEMO.orgDescription },
        });
        await tx.user.updateMany({
          where: { id: { in: roles.map(userId) } },
          data: { organizationId: orgId },
        });

        // ---- billing (read-only look at a paid plan) ----
        const periodStart = new Date(now.getTime() - 10 * DAY);
        const periodEnd = new Date(now.getTime() + 20 * DAY);
        const sub = await tx.subscription.upsert({
          where: { userId: userId('OWNER') },
          create: {
            userId: userId('OWNER'),
            plan: 'PREMIUM',
            amount: PLAN_AMOUNT,
            status: 'ACTIVE',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            lastPaymentDate: periodStart,
            nextPaymentDate: periodEnd,
          },
          update: {
            plan: 'PREMIUM',
            amount: PLAN_AMOUNT,
            status: 'ACTIVE',
            cancelAtPeriodEnd: false,
            canceledAt: null,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            lastPaymentDate: periodStart,
            nextPaymentDate: periodEnd,
          },
        });
        await tx.subscriptionPaymentHistory.deleteMany({
          where: { subscriptionId: sub.id },
        });
        await tx.subscriptionPaymentHistory.createMany({
          data: [1, 0].map((monthsAgo) => ({
            subscriptionId: sub.id,
            amount: PLAN_AMOUNT * 100,
            currency: 'usd',
            status: 'COMPLETED' as const,
            periodStart: new Date(periodStart.getTime() - monthsAgo * 30 * DAY),
            periodEnd: new Date(periodEnd.getTime() - monthsAgo * 30 * DAY),
            createdAt: new Date(periodStart.getTime() - monthsAgo * 30 * DAY),
          })),
        });

        // ---- catalogue ----
        await tx.supplier.createMany({
          data: SUPPLIERS.map((s, i) => ({
            id: supplierId(i),
            organizationId: orgId,
            name: s.name,
            email: s.email,
            phone: s.phone,
            address: s.address,
          })),
        });

        const spec = new Map(PRODUCTS.map((p) => [p.sku, p]));
        await tx.product.createMany({
          data: history.products.map((p) => {
            const s = spec.get(p.sku)!;
            return {
              id: productId(p.sku),
              organizationId: orgId,
              supplierId: supplierId(s.supplier),
              sku: s.sku,
              name: s.name,
              description: s.description,
              price: s.price,
              stock: p.stock,
              lowStockThreshold: s.threshold,
              archivedAt: p.archivedAt,
              createdAt: p.createdAt,
            };
          }),
        });

        // ---- history ----
        for (const part of chunks(history.movements)) {
          await tx.stockMovement.createMany({
            data: part.map((m) => ({
              id: `demo-mov-${m.key}`,
              organizationId: orgId,
              productId: productId(m.sku),
              performedById: userId(m.by),
              type: m.type,
              delta: m.delta,
              stockAfter: m.stockAfter,
              reason: m.reason,
              note: m.note,
              createdAt: m.createdAt,
            })),
          });
        }

        for (const part of chunks(history.requests)) {
          await tx.stockMovementRequest.createMany({
            data: part.map((r) => ({
              id: `demo-req-${r.key}`,
              organizationId: orgId,
              productId: productId(r.sku),
              requestedById: userId('STAFF'),
              decidedById: r.decidedBy ? userId(r.decidedBy) : null,
              movementId: r.movementKey ? `demo-mov-${r.movementKey}` : null,
              type: r.type,
              quantity: r.quantity,
              reason: r.reason,
              note: r.note,
              status: r.status,
              decisionNote: r.decisionNote,
              decidedAt: r.decidedAt,
              createdAt: r.createdAt,
            })),
          });
        }

        for (const part of chunks(history.notifications)) {
          await tx.notification.createMany({
            data: part.map((n) => ({
              organizationId: orgId,
              userId: userId(n.recipient),
              type: n.type,
              title: n.title,
              message: n.message,
              isRead: n.isRead,
              createdAt: n.createdAt,
              emailedAt: n.createdAt, // so the mail job never picks these up
              metadata: {
                productId: productId(n.sku),
                productName: spec.get(n.sku)!.name,
                ...(n.requestKey
                  ? { requestId: `demo-req-${n.requestKey}` }
                  : {}),
              },
            })),
          });
        }

        // Marks the data as fresh for resetIfStale().
        await tx.organization.update({
          where: { id: orgId },
          data: { updatedAt: new Date() },
        });
      },
      { timeout: 60_000, maxWait: 10_000 },
    );

    this.logger.log(
      `Demo reset: ${history.products.length} products, ${history.movements.length} movements, ` +
        `${history.requests.length} requests in ${Date.now() - started}ms`,
    );
  }
}
