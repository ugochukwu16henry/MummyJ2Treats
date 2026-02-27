import { Controller, Get, Param, Patch, Body, Req, UseGuards, UseInterceptors, UploadedFile, ForbiddenException, Post } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Get('me/profile')
  async myProfile(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    if (user.role === 'admin') {
      return this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    const vendor = await this.vendorsService.findByUserId(user.userId);
    return vendor;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Patch('me/profile-extra')
  async updateProfileExtra(
    @Req() req: Request,
    @Body()
    dto: {
      ownerFirstName?: string;
      ownerLastName?: string;
      contactEmail?: string;
      contactPhone?: string;
      country?: string;
      state?: string;
      city?: string;
      openDays?: string;
      openTime?: string;
      closeTime?: string;
      hasCertificate?: boolean;
      certificateDetails?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    return this.vendorsService.upsertProfileForVendor(vendor.id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Get('me/profile-extra')
  async myProfileExtra(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    return this.vendorsService.getProfileForVendor(vendor.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('file', { dest: 'uploads/vendor-profiles' }))
  async uploadProfileImage(
    @Req() req: Request,
    @UploadedFile() file?: any,
  ) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    if (!file) {
      throw new ForbiddenException('File is required');
    }
    const relative = `/uploads/vendor-profiles/${file.filename}`;
    const profile = await this.vendorsService.updateProfileImage(vendor.id, relative);
    return { url: profile?.profile_image_url ?? relative };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get(':id/profile-extra')
  async adminProfileExtra(@Param('id') id: string) {
    return this.vendorsService.getProfileForVendor(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
