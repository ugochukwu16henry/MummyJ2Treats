import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { VendorsModule } from '../vendors/vendors.module';

@Module({
  imports: [DatabaseModule, VendorsModule],
  providers: [TestimonialsService],
  controllers: [TestimonialsController],
})
export class TestimonialsModule {}

