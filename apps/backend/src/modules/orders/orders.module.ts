import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { VendorsModule } from '../vendors/vendors.module';
import { MoatModule } from '../moat/moat.module';

@Module({
  imports: [VendorsModule, MoatModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
