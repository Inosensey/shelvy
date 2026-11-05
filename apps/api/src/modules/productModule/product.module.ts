// users.module.ts
import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { ProductImportService } from './product.import.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService, ProductImportService, ProductRepository],
  exports: [ProductService],
})
export class ProductModule {}
