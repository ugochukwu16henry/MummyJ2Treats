import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { DeliveryService } from './delivery.service';

@Module({
  imports: [DatabaseModule],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
