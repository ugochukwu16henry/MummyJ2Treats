import { Controller, Get, Param, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { Request } from 'express';

@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  findAll() {
    return this.vendorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Patch(':id/approve')
  adminApprove(
    @Param('id') id: string,
    @Body()
    dto: {
      isVerified?: boolean;
      signupFeePaid?: boolean;
      subscriptionStatus?: 'trial' | 'active' | 'paused';
      currentPeriodEnd?: string | null;
      trialEndsAt?: string | null;
      commissionRate?: number;
    },
  ) {
    return this.vendorsService.updateAdminFlags(id, dto);
  }

  // Vendor/admin-only endpoints
  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Get('me/profile')
  async myProfile(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    return vendor;
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Patch('me/branding')
  async updateBranding(
    @Req() req: Request,
    @Body()
    dto: {
      businessName?: string;
      description?: string;
      logoUrl?: string;
      bannerUrl?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) return null;
    return this.vendorsService.updateBranding(vendor.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Patch('me/location-and-delivery')
  async updateLocationAndDelivery(
    @Req() req: Request,
    @Body()
    dto: {
      operatingState?: string;
      operatingCity?: string;
      operatingLga?: string;
      vendorLatitude?: number | null;
      vendorLongitude?: number | null;
      deliverOutsideState?: boolean;
      maxDeliveryRadiusKm?: number | null;
      deliveryPricePerKm?: number | null;
      deliveryMinFee?: number | null;
      deliveryFixedCityRate?: number | null;
      interStateDeliveryFee?: number | null;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) return null;
    return this.vendorsService.updateLocationAndDelivery(vendor.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Patch('me/payout')
  async updatePayout(
    @Req() req: Request,
    @Body()
    dto: {
      billingProvider?: 'manual' | 'paystack';
      bankAccountName?: string;
      bankAccountNumber?: string;
      bankBankName?: string;
      paystackSubaccountId?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) return null;
    return this.vendorsService.updatePayoutSettings(vendor.id, dto);
  }
}
