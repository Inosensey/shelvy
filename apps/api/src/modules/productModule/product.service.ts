import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductRepository } from './product.repository';
import {
  CreateProductDTO,
  ProductQueryDTO,
  UpdateProductDTO,
} from './product.dto';
import { Product } from 'generated/prisma/client';
import {
  CSV_BOM,
  MAX_EXPORT_ROWS,
  csvCell,
  csvRow,
  manilaDateTime,
} from 'src/utils/csv.util';

@Injectable()
export class ProductService {
  constructor(private readonly productRepo: ProductRepository) {}

  async assertExportable(orgId: string, q: ProductQueryDTO) {
    const total = await this.productRepo.countForExport(orgId, q);
    if (total > MAX_EXPORT_ROWS) {
      throw new BadRequestException(
        `Too many products to export (${total}). Narrow your filters first.`,
      );
    }
  }

  private convertPriceToNumber(p: Product) {
    return { ...p, price: Number(p.price) };
  }

  async getProducts(orgId: string, q: ProductQueryDTO) {
    const { items, total } = await this.productRepo.findMany(orgId, q);
    return {
      items: items.map((p) => this.convertPriceToNumber(p)),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }

  async getOptions(organizationId: string) {
    return await this.productRepo.options(organizationId);
  }

  async suggestSku(orgId: string, name: string) {
    if (!name?.trim())
      throw new BadRequestException('Enter a product name first.');
    return this.productRepo.suggestSku(orgId, name.trim());
  }

  async createProduct(orgId: string, userId: string, dto: CreateProductDTO) {
    return this.convertPriceToNumber(
      await this.productRepo.create(orgId, userId, dto),
    );
  }
  async updateProduct(id: string, orgId: string, dto: UpdateProductDTO) {
    return this.convertPriceToNumber(
      await this.productRepo.update(id, orgId, dto),
    );
  }
  async archiveProduct(id: string, orgId: string) {
    await this.productRepo.setArchived(id, orgId, true);
    return 'Product archived.';
  }
  async unarchiveProduct(id: string, orgId: string) {
    await this.productRepo.setArchived(id, orgId, false);
    return 'Product restored.';
  }
  async getProductDetails(id: string, orgId: string) {
    const { product, totalIn, totalOut, movementCount, trend } =
      await this.productRepo.detail(id, orgId);
    return {
      ...this.convertPriceToNumber(product),
      stats: { totalIn, totalOut, movementCount },
      trend,
    };
  }

  async *exportCsv(orgId: string, q: ProductQueryDTO): AsyncGenerator<string> {
    yield CSV_BOM +
      csvRow([
        'SKU',
        'Name',
        'Description',
        'Supplier',
        'Price',
        'Stock',
        'Low stock alert',
        'Status',
        'Created',
      ]);
    for await (const batch of this.productRepo.iterateForExport(orgId, q)) {
      for (const p of batch) {
        yield csvRow([
          csvCell(p.sku, { text: true }),
          csvCell(p.name, { text: true }),
          csvCell(p.description, { text: true }),
          csvCell(p.supplier?.name, { text: true }),
          csvCell(Number(p.price).toFixed(2)),
          csvCell(p.stock),
          csvCell(p.lowStockThreshold),
          csvCell(p.archivedAt ? 'Archived' : 'Active'),
          csvCell(manilaDateTime(p.createdAt)),
        ]);
      }
    }
  }
}
