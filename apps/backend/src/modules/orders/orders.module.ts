import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DatabaseModule } from '../../database/database.module';
import { VendorsModule } from '../vendors/vendors.module';
import { MoatModule } from '../moat/moat.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [DatabaseModule, VendorsModule, MoatModule, DeliveryModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
