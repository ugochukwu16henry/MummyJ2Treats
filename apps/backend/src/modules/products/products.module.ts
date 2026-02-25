import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductCacheService } from './product-cache.service';

@Module({
  imports: [],
  controllers: [ProductsController],
  providers: [ProductsService, ProductCacheService],
  exports: [ProductsService, ProductCacheService],
})
export class ProductsModule {}
