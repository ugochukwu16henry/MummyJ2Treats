import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FounderCategoriesPublicController } from './founder-categories.public.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController, FounderCategoriesPublicController],
  providers: [AdminService],
})
export class AdminModule {}
