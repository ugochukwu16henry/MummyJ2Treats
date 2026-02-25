import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { VendorsModule } from '../vendors/vendors.module';
import { RidersController } from './riders.controller';
import { RidersService } from './riders.service';

@Module({
  imports: [DatabaseModule, VendorsModule],
  controllers: [RidersController],
  providers: [RidersService],
  exports: [RidersService],
})
export class RidersModule {}
