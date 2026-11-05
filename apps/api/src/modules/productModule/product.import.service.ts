import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { parse } from 'csv-parse/sync';
import { MovementType } from 'generated/prisma/enums';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/PrismaConfig/prisma.service';
import { skuPrefix } from 'src/utils/sku.util';
import { CreateProductDTO } from './product.dto';

const MAX_ROWS = 1000;
const ALLOWED = [
  'sku',
  'name',
  'description',
  'supplier',
  'price',
  'low_stock_alert',
  'initial_stock',
];
const IGNORED = ['stock', 'status', 'created']; // present in our own export files
const REQUIRED = ['name', 'price'];

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

type Row = Record<string, string>;
type Action = 'create' | 'update' | 'unchanged' | 'error';

interface Parsed {
  row: number;
  dto: CreateProductDTO;
  supplierId?: string;
  action: Action;
  errors: string[];
  warnings: string[];
  generatedSku: boolean;
  id?: string;
  changes?: Prisma.ProductUncheckedUpdateManyInput;
  adopting?: boolean;
}

export interface ImportRowResult {
  row: number;
  action: Action;
  sku: string | null;
  name: string;
  errors: string[];
  warnings: string[];
  generatedSku: boolean;
}

const clean = (v: string | undefined) =>
  (v ?? '').replace(CONTROL_CHARS, '').trim();
const blankToUndefined = (v: string) => (v === '' ? undefined : v);

@Injectable()
export class ProductImportService {
  private readonly logger = new Logger(ProductImportService.name);

  constructor(private readonly prisma: PrismaService) {}
  private diff(
    p: Parsed,
    match: {
      name: string;
      description: string | null;
      price: unknown;
      lowStockThreshold: number;
      supplierId: string | null;
    },
  ): Prisma.ProductUncheckedUpdateManyInput {
    const changes: Prisma.ProductUncheckedUpdateManyInput = {};
    if (p.dto.name !== match.name) changes.name = p.dto.name;
    if (p.dto.description && p.dto.description !== match.description)
      changes.description = p.dto.description;
    if (Number(match.price) !== p.dto.price) changes.price = p.dto.price;
    if (
      p.dto.lowStockThreshold !== undefined &&
      p.dto.lowStockThreshold !== match.lowStockThreshold
    ) {
      changes.lowStockThreshold = p.dto.lowStockThreshold;
    }
    if (p.supplierId && p.supplierId !== match.supplierId)
      changes.supplierId = p.supplierId;
    return changes;
  }

  // ---------- 1. file -> rows (rejects the whole file on structural problems) ----------
  private parseFile(file: Express.Multer.File | undefined) {
    if (!file || !/\.csv$/i.test(file.originalname))
      throw new BadRequestException('Upload a .csv file.');
    if (file.size === 0) throw new BadRequestException('The file is empty.');
    if (file.buffer.includes(0))
      throw new BadRequestException('This does not look like a text CSV file.');

    let header: string[] = [];
    let records: Row[];
    try {
      records = parse(file.buffer, {
        bom: true,
        skip_empty_lines: true,
        trim: true,
        columns: (h: string[]) => {
          header = h.map((c) => c.trim().toLowerCase().replace(/\s+/g, '_'));
          return header;
        },
      });
    } catch (e) {
      throw new BadRequestException(
        `Could not read the CSV: ${e instanceof Error ? e.message : 'invalid format'}`,
      );
    }

    const dupes = [
      ...new Set(header.filter((h, i) => header.indexOf(h) !== i)),
    ];
    if (dupes.length)
      throw new BadRequestException(
        `Duplicate column(s): ${dupes.join(', ')}.`,
      );

    const unknown = header.filter(
      (h) => !ALLOWED.includes(h) && !IGNORED.includes(h),
    );
    if (unknown.length) {
      throw new BadRequestException(
        `Unknown column(s): ${unknown.map((u) => u || '(blank)').join(', ')}. Allowed: ${ALLOWED.join(', ')}.`,
      );
    }

    const missing = REQUIRED.filter((h) => !header.includes(h));
    if (missing.length)
      throw new BadRequestException(
        `Missing required column(s): ${missing.join(', ')}.`,
      );

    if (records.length === 0)
      throw new BadRequestException('The file has no data rows.');
    if (records.length > MAX_ROWS)
      throw new BadRequestException(
        `Too many rows (${records.length}). The maximum is ${MAX_ROWS}.`,
      );

    return {
      records,
      ignoredColumns: header.filter((h) => IGNORED.includes(h)),
    };
  }

  // ---------- 2. rows -> plan (validation + create/update decision) ----------
  private async plan(
    db: Prisma.TransactionClient,
    organizationId: string,
    records: Row[],
  ) {
    const suppliers = await db.supplier.findMany({
      where: { organizationId },
      select: { id: true, name: true },
    });
    const supplierByName = new Map(
      suppliers.map((s) => [s.name.toLowerCase(), s.id]),
    );

    // pass 1: the same rules as the product form, row by row
    const parsed: Parsed[] = [];
    const seenSkus = new Map<string, number>();

    for (let i = 0; i < records.length; i++) {
      const raw = records[i];
      const errors: string[] = [];

      const dto = plainToInstance(CreateProductDTO, {
        name: clean(raw.name),
        description: clean(raw.description),
        sku: clean(raw.sku),
        price: blankToUndefined(clean(raw.price)),
        lowStockThreshold: blankToUndefined(clean(raw.low_stock_alert)),
        initialStock: blankToUndefined(clean(raw.initial_stock)),
      });

      for (const issue of await validate(dto))
        errors.push(...Object.values(issue.constraints ?? {}));

      const supplierName = clean(raw.supplier);
      let supplierId: string | undefined;
      if (supplierName) {
        supplierId = supplierByName.get(supplierName.toLowerCase());
        if (!supplierId)
          errors.push(`Unknown supplier "${supplierName}". Create it first.`);
      }

      if (dto.sku) {
        const first = seenSkus.get(dto.sku);
        if (first) errors.push(`Duplicate SKU (also on row ${first}).`);
        else seenSkus.set(dto.sku, i + 2); // +2: header is row 1
      }

      parsed.push({
        row: i + 2,
        dto,
        supplierId,
        action: errors.length ? 'error' : 'create',
        errors,
        warnings: [],
        generatedSku: false,
      });
    }

    // pass 2: which SKUs already exist in this organization?
    const skus = [...seenSkus.keys()];
    const existing = skus.length
      ? await db.product.findMany({
          where: { organizationId, sku: { in: skus } },
          select: {
            id: true,
            sku: true,
            name: true,
            description: true,
            price: true,
            lowStockThreshold: true,
            supplierId: true,
            archivedAt: true,
          },
        })
      : [];
    const bySku = new Map(existing.map((p) => [p.sku!, p]));

    for (const p of parsed) {
      if (p.action === 'error' || !p.dto.sku) continue;
      const match = bySku.get(p.dto.sku);
      if (!match) continue; // stays 'create'

      if (match.archivedAt) {
        p.action = 'error';
        p.errors.push('This product is archived. Restore it first.');
        continue;
      }
      if (p.dto.initialStock !== undefined) {
        p.warnings.push(
          'Initial stock ignored: stock only changes through movements.',
        );
      }
      p.id = match.id;
      p.changes = this.diff(p, match);
      p.action = Object.keys(p.changes).length ? 'update' : 'unchanged';
    }

    // pass 2b: a blank-SKU row can adopt an existing product that has no SKU, matched by name
    const unmatched = parsed.filter((p) => p.action === 'create');
    if (unmatched.length) {
      const candidates = await db.product.findMany({
        where: {
          organizationId,
          sku: null,
          archivedAt: null,
          OR: unmatched.map((p) => ({
            name: { equals: p.dto.name, mode: 'insensitive' as const },
          })),
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          lowStockThreshold: true,
          supplierId: true,
        },
      });

      const candidatesByName = new Map<string, typeof candidates>();
      for (const c of candidates) {
        const key = c.name.toLowerCase();
        candidatesByName.set(key, [...(candidatesByName.get(key) ?? []), c]);
      }
      const rowsByName = new Map<string, number>();
      for (const p of unmatched) {
        const key = p.dto.name.toLowerCase();
        rowsByName.set(key, (rowsByName.get(key) ?? 0) + 1);
      }

      for (const p of unmatched) {
        const key = p.dto.name.toLowerCase();
        const matches = candidatesByName.get(key) ?? [];

        if (matches.length === 1 && rowsByName.get(key) === 1) {
          p.id = matches[0].id;
          p.adopting = true;
          p.changes = this.diff(p, matches[0]);
          if (p.dto.sku) p.changes.sku = p.dto.sku; // the SKU you typed; blank ones are generated in pass 3
          p.action = 'update';
          p.warnings.push(
            p.dto.sku
              ? `Matched an existing product by name. SKU ${p.dto.sku} will be assigned to it.`
              : 'Matched an existing product by name. A SKU will be assigned to it.',
          );
          if (p.dto.initialStock !== undefined) {
            p.warnings.push(
              'Initial stock ignored: stock only changes through movements.',
            );
          }
        } else if (matches.length > 1) {
          p.warnings.push(
            'Several products have this name. Add a SKU to the file to update the right one.',
          );
        }
      }
    }

    // pass 3: generate SKUs for new rows and adopted rows that came without one
    const needsSku = parsed.filter(
      (p) =>
        p.action !== 'error' &&
        !p.dto.sku &&
        (p.action === 'create' || p.adopting),
    );
    if (needsSku.length) {
      const prefixes = [...new Set(needsSku.map((p) => skuPrefix(p.dto.name)))];
      const rows = await db.product.findMany({
        where: {
          organizationId,
          OR: prefixes.map((pr) => ({ sku: { startsWith: `${pr}-` } })),
        },
        select: { sku: true },
      });
      const used = [...rows.map((r) => r.sku!), ...seenSkus.keys()];

      const counters = new Map<string, number>();
      for (const pr of prefixes) {
        const re = new RegExp(`^${pr}-(\\d+)$`);
        counters.set(
          pr,
          used.reduce((max, s) => {
            const hit = re.exec(s);
            return hit ? Math.max(max, Number(hit[1])) : max;
          }, 0),
        );
      }
      for (const p of needsSku) {
        const pr = skuPrefix(p.dto.name);
        const next = counters.get(pr)! + 1;
        counters.set(pr, next);
        p.dto.sku = `${pr}-${String(next).padStart(4, '0')}`;
        p.generatedSku = true;
        if (p.adopting) p.changes!.sku = p.dto.sku; // assigned to the existing product
      }
    }

    const creating = parsed.filter((p) => p.action === 'create');
    if (creating.length) {
      const sameName = await db.product.findMany({
        where: {
          organizationId,
          OR: creating.map((p) => ({
            name: { equals: p.dto.name, mode: 'insensitive' as const },
          })),
        },
        select: { name: true },
      });
      const taken = new Set(sameName.map((s) => s.name.toLowerCase()));
      for (const p of creating) {
        if (taken.has(p.dto.name.toLowerCase())) {
          p.warnings.push(
            'A product with this name already exists. This row will create another one.',
          );
        }
      }
    }

    return parsed;
  }

  private toResults(parsed: Parsed[]): ImportRowResult[] {
    return parsed.map((p) => ({
      row: p.row,
      action: p.action,
      sku: p.dto.sku ?? null,
      name: p.dto.name ?? '',
      errors: p.errors,
      warnings: p.warnings,
      generatedSku: p.generatedSku,
    }));
  }

  // ---------- public: preview (writes nothing) ----------
  async preview(organizationId: string, file: Express.Multer.File | undefined) {
    const { records, ignoredColumns } = this.parseFile(file);
    const parsed = await this.plan(this.prisma, organizationId, records);
    const count = (a: Action) => parsed.filter((p) => p.action === a).length;
    return {
      summary: {
        create: count('create'),
        update: count('update'),
        unchanged: count('unchanged'),
        errors: count('error'),
      },
      rows: this.toResults(parsed),
      ignoredColumns,
    };
  }

  // ---------- public: commit (re-validates, then all or nothing) ----------
  async commit(
    organizationId: string,
    userId: string,
    file: Express.Multer.File | undefined,
  ) {
    const { records } = this.parseFile(file);

    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          const parsed = await this.plan(tx, organizationId, records);

          const errors = parsed.filter((p) => p.action === 'error').length;
          if (errors)
            throw new BadRequestException(
              `Fix the ${errors} row error(s) before importing.`,
            );

          const creates = parsed.filter((p) => p.action === 'create');
          const updates = parsed.filter((p) => p.action === 'update');

          if (creates.length) {
            const created = await tx.product.createManyAndReturn({
              data: creates.map((p) => ({
                name: p.dto.name,
                sku: p.dto.sku!,
                description: p.dto.description ?? null,
                price: p.dto.price,
                lowStockThreshold: p.dto.lowStockThreshold ?? 5,
                stock: p.dto.initialStock ?? 0,
                supplierId: p.supplierId ?? null,
                organizationId,
              })),
              select: { id: true, sku: true },
            });
            const idBySku = new Map(created.map((c) => [c.sku!, c.id]));

            const movements = creates
              .filter((p) => (p.dto.initialStock ?? 0) > 0)
              .map((p) => ({
                type: MovementType.INITIAL,
                delta: p.dto.initialStock!,
                stockAfter: p.dto.initialStock!,
                reason: 'Initial stock (CSV import)',
                organizationId,
                productId: idBySku.get(p.dto.sku!)!,
                performedById: userId,
              }));
            if (movements.length)
              await tx.stockMovement.createMany({ data: movements });
          }

          for (const p of updates) {
            await tx.product.updateMany({
              where: { id: p.id, organizationId },
              data: p.changes!,
            });
          }

          return {
            created: creates.length,
            updated: updates.length,
            unchanged: parsed.filter((p) => p.action === 'unchanged').length,
          };
        },
        { timeout: 60_000, maxWait: 10_000 },
      );

      this.logger.log(
        `Product import by user ${userId} (org ${organizationId}): ${JSON.stringify(result)}`,
      );
      return result;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          'A SKU in this file was taken while importing. Run the preview again.',
        );
      }
      throw e;
    }
  }
}
