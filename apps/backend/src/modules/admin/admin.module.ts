import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ProductsModule } from '../products/products.module';
import { VendorsModule } from '../vendors/vendors.module';
import { UsersModule } from '../users/users.module';
import { RidersModule } from '../riders/riders.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FounderCategoriesPublicController } from './founder-categories.public.controller';
import { FounderPublicController } from './founder.public.controller';

@Module({
  imports: [DatabaseModule, ProductsModule, VendorsModule, UsersModule, RidersModule],
  controllers: [AdminController, FounderCategoriesPublicController, FounderPublicController],
  providers: [AdminService],
})
export class AdminModule {}
