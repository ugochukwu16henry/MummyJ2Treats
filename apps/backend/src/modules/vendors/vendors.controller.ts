import { Controller, Get, Param, Patch, Body, Req, UseGuards, UseInterceptors, UploadedFile, ForbiddenException, Post } from '@nestjs/common';
import { VendorsService } from './vendors.service';
import { StorageService } from '../storage/storage.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@Controller('vendors')
export class VendorsController {
  constructor(
    private readonly vendorsService: VendorsService,
    private readonly storageService: StorageService,
  ) {}

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
  @Get('me/profile-picture')
  async getProfilePicture(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    const profile = await this.vendorsService.getProfileForVendor(vendor.id);
    const url = (profile as { profile_image_url?: string } | null)?.profile_image_url ?? null;
    return { url };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Post('me/profile-image')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadProfileImage(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    if (!file || !file.buffer) {
      throw new ForbiddenException('File is required');
    }
    const url = await this.storageService.upload(
      file.buffer,
      'vendor-profiles',
      file.originalname || 'image',
      file.mimetype,
    );
    const profile = await this.vendorsService.updateProfileImage(vendor.id, url);
    return { url: profile?.profile_image_url ?? url };
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
