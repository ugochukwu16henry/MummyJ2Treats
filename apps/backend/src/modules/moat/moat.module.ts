import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { VendorsModule } from '../vendors/vendors.module';
import { MoatController } from './moat.controller';
import { DataMoatService } from './data-moat.service';
import { ReferralService } from './referral.service';
import { LoyaltyService } from './loyalty.service';
import { VendorBonusService } from './vendor-bonus.service';
import { OnboardingService } from './onboarding.service';
import { PayoutService } from './payout.service';
import { FraudService } from './fraud.service';
import { CancellationService } from './cancellation.service';

@Module({
  imports: [DatabaseModule, VendorsModule],
  controllers: [MoatController],
  providers: [
    DataMoatService,
    ReferralService,
    LoyaltyService,
    VendorBonusService,
    OnboardingService,
    PayoutService,
    FraudService,
    CancellationService,
  ],
  exports: [ReferralService, LoyaltyService, FraudService, CancellationService],
})
export class MoatModule {}
