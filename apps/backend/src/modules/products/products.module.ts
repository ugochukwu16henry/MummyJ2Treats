import { Module } from '@nestjs/common';
import { ProductCacheService } from './product-cache.service';

@Module({
  imports: [],
  controllers: [],
  providers: [ProductCacheService],
  exports: [ProductCacheService],
})
export class ProductsModule {}
