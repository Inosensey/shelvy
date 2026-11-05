import { Injectable } from '@nestjs/common';
import { SupplierRepository } from './supplier.repository';
import {
  CreateSupplierDTO,
  SupplierQueryDTO,
  UpdateSupplierDTO,
} from './supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly repo: SupplierRepository) {}

  async getSuppliers(organizationId: string, q: SupplierQueryDTO) {
    const { items, total } = await this.repo.findMany(organizationId, q);
    return {
      items: items.map(({ _count, ...s }) => ({
        ...s,
        productsCount: _count.products,
      })),
      total,
      page: q.page,
      pageSize: q.pageSize,
    };
  }

  getOptions(organizationId: string) {
    return this.repo.options(organizationId);
  }
  createSupplier(organizationId: string, dto: CreateSupplierDTO) {
    return this.repo.create(organizationId, dto);
  }
  updateSupplier(id: string, organizationId: string, dto: UpdateSupplierDTO) {
    return this.repo.update(id, organizationId, dto);
  }
  deleteSupplier(id: string, organizationId: string) {
    return this.repo.delete(id, organizationId);
  }
}
