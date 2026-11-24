// Pure, deterministic generator for the demo workspace history.
// No database, no Nest, no randomness from Math.random(): the same `now`
// always produces the same story, only shifted in time.
//
// Invariants (checked by demo.check.ts):
//  - per product, movements in time order form a running balance (stockAfter)
//  - stock never goes negative
//  - product.stock === last movement's stockAfter
//  - every APPROVED request has exactly one movement, performed by the requester
//  - nothing is dated in the future

import { DEMO, DemoRole, PRODUCTS, ProductSpec } from './demo.data';

export type GenMovementType = 'INITIAL' | 'IN' | 'OUT' | 'ADJUSTMENT';
export type GenRequestStatus =
  'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface GenProduct {
  sku: string;
  stock: number;
  archivedAt: Date | null;
  createdAt: Date;
}

export interface GenMovement {
  key: string;
  sku: string;
  type: GenMovementType;
  delta: number;
  stockAfter: number;
  reason: string | null;
  note: string | null;
  by: DemoRole;
  createdAt: Date;
}

export interface GenRequest {
  key: string;
  sku: string;
  type: 'IN' | 'OUT';
  quantity: number;
  reason: string | null;
  note: string | null;
  status: GenRequestStatus;
  decisionNote: string | null;
  decidedBy: DemoRole | null;
  createdAt: Date;
  decidedAt: Date | null;
  movementKey: string | null;
}

export interface GenNotification {
  recipient: DemoRole;
  type: 'LOW_STOCK' | 'MOVEMENT_REQUESTED' | 'MOVEMENT_DECIDED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  sku: string;
  requestKey: string | null;
}

export interface DemoHistory {
  products: GenProduct[];
  movements: GenMovement[];
  requests: GenRequest[];
  notifications: GenNotification[];
}

// ---------- helpers ----------

const MIN = 60_000;
const DAY = 86_400_000;
const MANILA_OFFSET = 8 * 60 * MIN; // UTC+8, no DST

/** Midnight (Manila) at the start of the Manila day that contains `d`, as a UTC ms timestamp. */
export function manilaMidnight(d: Date): number {
  const shifted = d.getTime() + MANILA_OFFSET;
  return Math.floor(shifted / DAY) * DAY - MANILA_OFFSET;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(rng: () => number, lambda: number): number {
  if (lambda <= 0) return 0;
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > limit);
  return k - 1;
}

const pick = <T>(rng: () => number, arr: readonly T[]): T =>
  arr[Math.floor(rng() * arr.length)];

const SALE_REASONS = [
  'Sale',
  'Sale',
  'Sale',
  'Walk-in customer',
  'Online order',
  'Corporate order',
] as const;
const STAFF_SALE_REASONS = [
  'Sale',
  'Walk-in customer',
  'Online order',
] as const;
const ADJUST_REASONS = [
  {
    reason: 'Inventory count correction',
    note: 'Found during weekly shelf count.',
  },
  { reason: 'Damaged item', note: 'Box damaged in storage, unit written off.' },
] as const;

// ---------- generator ----------

const BIZ_START = 9 * 60 + 30; // 09:30 Manila
const BIZ_END = 19 * 60; // 19:00 Manila
const LOW_WINDOW_DAYS = 12; // products with `endLow` wind down over this many days
const NOTIFICATION_DAYS = 7;

interface PendingEvent {
  minute: number; // time of the movement (decision time for staff requests)
  kind: 'restock' | 'sale' | 'adjust';
  delta: number;
  reason: string;
  note: string | null;
  viaStaff: boolean;
  delay: number; // minutes between request and decision (staff only)
}

export function generateHistory(now: Date, seed = 20260101): DemoHistory {
  const rng = mulberry32(seed);
  const todayMid = manilaMidnight(now);
  const nowMin = (now.getTime() - todayMid) / MIN;
  const N = DEMO.historyDays;
  const at = (daysAgo: number, minute: number) =>
    new Date(todayMid - daysAgo * DAY + minute * MIN);

  const products: GenProduct[] = [];
  const movements: GenMovement[] = [];
  const requests: GenRequest[] = [];
  const notifications: GenNotification[] = [];
  let mSeq = 0;
  let rSeq = 0;
  const nameOf = new Map(PRODUCTS.map((p) => [p.sku, p.name]));
  const specOf = new Map(PRODUCTS.map((p) => [p.sku, p]));

  const addMovement = (m: Omit<GenMovement, 'key'>) => {
    const key = `m${++mSeq}`;
    movements.push({ key, ...m });
    return key;
  };

  const lowStock = (
    p: ProductSpec,
    before: number,
    after: number,
    when: Date,
  ) => {
    if (before > p.threshold && after <= p.threshold) {
      const out = after === 0;
      for (const recipient of ['OWNER', 'MANAGER'] as const) {
        notifications.push({
          recipient,
          type: 'LOW_STOCK',
          title: out ? `Out of stock: ${p.name}` : `Low stock: ${p.name}`,
          message: out
            ? `${p.name} is out of stock.`
            : `${p.name} is down to ${after} (alert level ${p.threshold}).`,
          isRead: false, // fixed up below
          createdAt: when,
          sku: p.sku,
          requestKey: null,
        });
      }
    }
  };

  for (const p of PRODUCTS) {
    const start = at(N, 9 * 60);
    let stock = p.opening;
    addMovement({
      sku: p.sku,
      type: 'INITIAL',
      delta: p.opening,
      stockAfter: p.opening,
      reason: 'Opening stock',
      note: null,
      by: 'OWNER',
      createdAt: start,
    });

    if (p.archived) {
      // Sold off, then archived.
      const clearAt = at(45, 14 * 60);
      addMovement({
        sku: p.sku,
        type: 'OUT',
        delta: -stock,
        stockAfter: 0,
        reason: 'Clearance sale',
        note: 'Discontinued model, sold all remaining units.',
        by: 'MANAGER',
        createdAt: clearAt,
      });
      stock = 0;
      products.push({
        sku: p.sku,
        stock,
        archivedAt: at(44, 10 * 60),
        createdAt: start,
      });
      continue;
    }

    let remaining = 0; // units still to sell off for `endLow` products

    for (let d = N - 1; d >= 0; d--) {
      const end = d === 0 ? Math.min(BIZ_END, nowMin - 10) : BIZ_END;
      const span = end - BIZ_START;
      if (span < 20) continue;

      const inLow = p.endLow !== undefined && d <= LOW_WINDOW_DAYS;
      const events: PendingEvent[] = [];
      let avail = stock;

      // Prep restock right before the wind-down so there is something to sell.
      if (p.endLow !== undefined && d === LOW_WINDOW_DAYS) {
        const target = p.endLow + 10;
        if (stock < p.endLow + 8) {
          const qty = target - stock;
          events.push(restock(rng, span, qty));
          avail += qty;
        }
        remaining = avail - p.endLow;
      }

      const dow = new Date(todayMid - d * DAY + MANILA_OFFSET).getUTCDay();
      const dowFactor = dow === 0 || dow === 6 ? 1.3 : dow === 1 ? 0.85 : 1;

      if (inLow) {
        // Spread the wind-down over the remaining days, last full day sells the rest.
        let n = 0;
        if (d >= 1) {
          n =
            d === 1
              ? remaining
              : Math.min(
                  remaining,
                  Math.round((remaining / d) * (0.6 + 0.8 * rng())),
                );
          remaining -= n;
        }
        pushSales(events, rng, span, n, true);
      } else {
        if (avail <= p.threshold) {
          const qty = Math.max(
            p.threshold * 2,
            Math.round(p.opening * (0.6 + 0.3 * rng())),
          );
          events.push(restock(rng, span, qty));
          avail += qty;
        }
        let n = poisson(rng, p.rate * dowFactor);
        n = Math.min(n, avail);
        avail -= n;
        pushSales(events, rng, span, n, false);
        if (rng() < 0.012 && avail > 3) {
          const down = rng() < 0.7;
          const a = pick(rng, ADJUST_REASONS);
          events.push({
            minute: BIZ_START + span * (0.1 + 0.85 * rng()),
            kind: 'adjust',
            delta: down ? -1 : 1,
            reason: a.reason,
            note: a.note,
            viaStaff: false,
            delay: 0,
          });
          if (down) avail -= 1;
        }
      }

      events.sort((a, b) => a.minute - b.minute);
      for (const e of events) {
        const minuteAbs = BIZ_START + Math.max(0, e.minute - BIZ_START);
        const when = at(d, Math.min(minuteAbs, end));
        const before = stock;
        stock += e.delta;
        const type: GenMovementType =
          e.kind === 'adjust' ? 'ADJUSTMENT' : e.delta > 0 ? 'IN' : 'OUT';
        const by: DemoRole = e.viaStaff
          ? 'STAFF'
          : e.kind === 'restock'
            ? 'MANAGER'
            : e.kind === 'adjust'
              ? rng() < 0.5
                ? 'OWNER'
                : 'MANAGER'
              : rng() < 0.6
                ? 'MANAGER'
                : 'OWNER';
        const mKey = addMovement({
          sku: p.sku,
          type,
          delta: e.delta,
          stockAfter: stock,
          reason: e.reason,
          note: e.note,
          by,
          createdAt: when,
        });
        lowStock(p, before, stock, when);

        if (e.viaStaff) {
          requests.push({
            key: `r${++rSeq}`,
            sku: p.sku,
            type: e.delta > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(e.delta),
            reason: e.reason,
            note: e.note,
            status: 'APPROVED',
            decisionNote: null,
            decidedBy: rng() < 0.7 ? 'MANAGER' : 'OWNER',
            createdAt: new Date(when.getTime() - e.delay * MIN),
            decidedAt: when,
            movementKey: mKey,
          });
        }
      }
    }

    products.push({ sku: p.sku, stock, archivedAt: null, createdAt: start });
  }

  // Order numbers for direct sales, assigned in time order so they increase.
  movements.sort(
    (a, b) =>
      a.createdAt.getTime() - b.createdAt.getTime() ||
      a.key.localeCompare(b.key, 'en', { numeric: true }),
  );
  const reqByMovement = new Map(
    requests.filter((r) => r.movementKey).map((r) => [r.movementKey!, r]),
  );
  let order = 1001;
  for (const m of movements) {
    if (m.note === '__order__') {
      m.note = `Order #${order++}`;
      const r = reqByMovement.get(m.key);
      if (r) r.note = m.note;
    }
  }

  // ---------- requests that never became movements ----------
  const stockNow = new Map(products.map((p) => [p.sku, p.stock]));
  const extra = (
    sku: string,
    type: 'IN' | 'OUT',
    quantity: number,
    status: GenRequestStatus,
    createdAgoMin: number,
    reason: string,
    note: string | null,
    decisionNote: string | null,
    decideAfterMin: number | null,
    decidedBy: DemoRole | null,
  ) => {
    const createdAt = new Date(now.getTime() - createdAgoMin * MIN);
    requests.push({
      key: `r${++rSeq}`,
      sku,
      type,
      quantity,
      reason,
      note,
      status,
      decisionNote,
      decidedBy,
      createdAt,
      decidedAt:
        decideAfterMin === null
          ? null
          : new Date(createdAt.getTime() + decideAfterMin * MIN),
      movementKey: null,
    });
  };

  const D = (days: number, hour = 0) => days * 1440 + hour * 60;
  // pending (newest first so the queue looks live)
  extra(
    'HUB-0001',
    'OUT',
    5,
    'PENDING',
    95,
    'Display unit',
    'For the new branch counter.',
    null,
    null,
    null,
  );
  extra(
    'RAM-0001',
    'IN',
    20,
    'PENDING',
    310,
    'Restock from supplier',
    'Delivery received this morning.',
    null,
    null,
    null,
  );
  extra(
    'MOU-0001',
    'OUT',
    3,
    'PENDING',
    D(1, 3),
    'Online order',
    'Order #1090, ships tomorrow.',
    null,
    null,
    null,
  );
  // rejected
  extra(
    'GPU-0001',
    'OUT',
    2,
    'REJECTED',
    D(3, 5),
    'Sale',
    'Customer is waiting at the counter.',
    'Stock count looks off. Please recount the shelf first.',
    40,
    'MANAGER',
  );
  extra(
    'LAP-0001',
    'OUT',
    1,
    'REJECTED',
    D(5, 2),
    'Staff purchase',
    null,
    'Staff purchases are handled by the owner directly.',
    95,
    'OWNER',
  );
  extra(
    'CBL-0002',
    'IN',
    200,
    'REJECTED',
    D(9, 1),
    'Restock from supplier',
    'Big delivery.',
    'Quantity looks too high. Please confirm against the delivery receipt.',
    150,
    'MANAGER',
  );
  // cancelled by the requester
  extra(
    'PAD-0001',
    'OUT',
    10,
    'CANCELLED',
    D(2, 6),
    'Corporate order',
    'Customer changed their mind.',
    null,
    null,
    null,
  );
  extra(
    'EAR-0001',
    'IN',
    15,
    'CANCELLED',
    D(7, 4),
    'Restock from supplier',
    'Entered by mistake.',
    null,
    null,
    null,
  );
  void stockNow;

  requests.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // ---------- request notifications ----------
  const staffName = `${DEMO.users.STAFF.firstName} ${DEMO.users.STAFF.lastName}`;
  const cutoff = now.getTime() - NOTIFICATION_DAYS * DAY;
  for (const r of requests) {
    const name = nameOf.get(r.sku)!;
    const verb = r.type === 'OUT' ? 'remove' : 'add';
    const what = `${r.quantity} × ${name}`;
    if (r.createdAt.getTime() >= cutoff) {
      for (const recipient of ['OWNER', 'MANAGER'] as const) {
        notifications.push({
          recipient,
          type: 'MOVEMENT_REQUESTED',
          title: 'New stock request',
          message: `${staffName} requested to ${verb} ${what}${r.reason ? ` (${r.reason})` : ''}.`,
          isRead: r.status !== 'PENDING',
          createdAt: r.createdAt,
          sku: r.sku,
          requestKey: r.key,
        });
      }
    }
    if (
      (r.status === 'APPROVED' || r.status === 'REJECTED') &&
      r.decidedAt &&
      r.decidedAt.getTime() >= cutoff
    ) {
      const approved = r.status === 'APPROVED';
      notifications.push({
        recipient: 'STAFF',
        type: 'MOVEMENT_DECIDED',
        title: approved ? 'Request approved' : 'Request rejected',
        message: approved
          ? `Your request to ${verb} ${what} was approved.`
          : `Your request to ${verb} ${what} was rejected.${r.decisionNote ? ` ${r.decisionNote}` : ''}`,
        isRead: false, // fixed up below
        createdAt: r.decidedAt,
        sku: r.sku,
        requestKey: r.key,
      });
    }
  }

  // Keep only the recent low-stock ones, and mark older ones read.
  const keep = notifications.filter(
    (n) => n.type !== 'LOW_STOCK' || n.createdAt.getTime() >= cutoff,
  );
  for (const n of keep) {
    if (n.type === 'MOVEMENT_REQUESTED') continue;
    n.isRead = now.getTime() - n.createdAt.getTime() > 3 * DAY;
  }
  keep.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  void specOf;
  return { products, movements, requests, notifications: keep };
}

function restock(rng: () => number, span: number, qty: number): PendingEvent {
  const viaStaff = rng() < 0.1;
  return {
    minute: BIZ_START + span * 0.06 * rng(),
    kind: 'restock',
    delta: qty,
    reason: 'Restock from supplier',
    note: `Delivery receipt DR-${2000 + Math.floor(rng() * 7000)}`,
    viaStaff,
    delay: 10 + Math.floor(rng() * 90),
  };
}

function pushSales(
  events: PendingEvent[],
  rng: () => number,
  span: number,
  units: number,
  staffToo: boolean,
) {
  let left = units;
  while (left > 0) {
    const q = Math.min(left, 1 + Math.floor(rng() * 3));
    left -= q;
    const viaStaff = rng() < 0.08;
    events.push({
      minute: BIZ_START + span * (0.08 + 0.92 * rng()),
      kind: 'sale',
      delta: -q,
      reason: viaStaff
        ? pick(rng, STAFF_SALE_REASONS)
        : pick(rng, SALE_REASONS),
      note: rng() < 0.4 ? '__order__' : null,
      viaStaff,
      delay: 10 + Math.floor(rng() * 110),
    });
  }
  void staffToo;
}
