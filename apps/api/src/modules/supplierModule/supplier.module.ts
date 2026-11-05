// users.module.ts
import { Module } from '@nestjs/common';
import { SuppliersController } from './supplier.controller';
import { SupplierService } from './supplier.service';
import { SupplierRepository } from './supplier.repository';

@Module({
  controllers: [SuppliersController],
  providers: [SupplierService, SupplierRepository],
  exports: [SupplierService],
})
export class SupplierModule {}
