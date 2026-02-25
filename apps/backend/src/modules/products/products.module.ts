import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductCacheService } from './product-cache.service';
import { DatabaseModule } from '../../database/database.module';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [DatabaseModule, VendorsModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductCacheService],
  exports: [ProductsService, ProductCacheService],
})
export class ProductsModule {}
