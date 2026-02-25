import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { DataMoatService } from './data-moat.service';
import { ReferralService } from './referral.service';
import { LoyaltyService } from './loyalty.service';
import { VendorBonusService } from './vendor-bonus.service';
import { OnboardingService } from './onboarding.service';
import { PayoutService } from './payout.service';
import { CancellationService } from './cancellation.service';
import { VendorsService } from '../vendors/vendors.service';
import { Request } from 'express';

@Controller('moat')
export class MoatController {
  constructor(
    private readonly dataMoat: DataMoatService,
    private readonly referral: ReferralService,
    private readonly loyalty: LoyaltyService,
    private readonly vendorBonus: VendorBonusService,
    private readonly onboarding: OnboardingService,
    private readonly payout: PayoutService,
    private readonly cancellation: CancellationService,
    private readonly vendorsService: VendorsService,
  ) {}

  // ---- Layer 1: Data Moat (public or auth) ----
  @Get('vendors/ranked')
  getRankedVendors(@Query('limit') limit?: string) {
    return this.dataMoat.getRankedVendors(limit ? parseInt(limit, 10) : 20);
  }

  @Get('recommendations')
  getPublicRecommendations(@Query('limit') limit?: string) {
    return this.dataMoat.getPublicRecommendations(limit ? parseInt(limit, 10) : 10);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('recommendations/me')
  getMyRecommendations(@Req() req: Request, @Query('limit') limit?: string) {
    const user = req.user as { userId: string; role: string };
    return this.dataMoat.getRecommendationsForCustomer(user.userId, limit ? parseInt(limit, 10) : 10);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Get('heatmap')
  getHeatmap(@Query('days') days?: string) {
    return this.dataMoat.getDeliveryHeatmap(days ? parseInt(days, 10) : 30);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Post('reliability/refresh')
  refreshReliability(@Body() body: { periodDate?: string }) {
    const periodDate = body.periodDate ?? new Date().toISOString().slice(0, 7) + '-01';
    return this.dataMoat.refreshVendorReliability(periodDate);
  }

  // ---- Layer 2: Referrals ----
  @UseGuards(AuthGuard('jwt'))
  @Get('referral/me')
  getMyReferralCode(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.referral.getOrCreateCode(user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('referral/stats')
  getReferralStats(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.referral.getStats(user.userId);
  }

  @Post('referral/apply')
  applyReferralCode(@Body() body: { userId: string; code: string }) {
    return this.referral.applyCode(body.userId, body.code);
  }

  // ---- Layer 2: Loyalty ----
  @UseGuards(AuthGuard('jwt'))
  @Get('loyalty/me')
  getLoyaltyBalance(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.loyalty.getBalance(user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('loyalty/transactions')
  getLoyaltyTransactions(@Req() req: Request, @Query('limit') limit?: string) {
    const user = req.user as { userId: string };
    return this.loyalty.getTransactions(user.userId, limit ? parseInt(limit, 10) : 20);
  }

  // ---- Layer 2: Vendor bonuses ----
  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Get('vendor-bonuses')
  async listMyBonuses(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    const vendorId = await this.getVendorId(req);
    if (!vendorId && user.role !== 'admin') return { data: [] };
    return this.vendorBonus.listForVendor(vendorId!);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Get('vendor-bonuses/suggestions')
  getBonusSuggestions(@Query('periodDate') periodDate: string) {
    const date = periodDate ?? new Date().toISOString().slice(0, 10);
    return this.vendorBonus.computeSuggestions(date);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Post('vendor-bonuses')
  createBonus(@Body() body: { vendorId: string; periodDate: string; amount: number; criteria?: string }) {
    return this.vendorBonus.create(body.vendorId, body.periodDate, body.amount, body.criteria ?? '');
  }

  // ---- Layer 3: Onboarding ----
  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Get('onboarding')
  async getOnboarding(@Req() req: Request) {
    const vendorId = await this.getVendorId(req);
    if (!vendorId) return { steps: [], complete: false };
    return this.onboarding.getStatus(vendorId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Patch('onboarding/:stepKey')
  async completeOnboardingStep(@Req() req: Request, @Param('stepKey') stepKey: string, @Body() body?: { payload?: Record<string, unknown> }) {
    const vendorId = await this.getVendorId(req);
    if (!vendorId) return { steps: [], complete: false };
    return this.onboarding.completeStep(vendorId, stepKey, body?.payload);
  }

  // ---- Layer 3: Payouts ----
  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Get('payout-runs')
  listPayoutRuns(@Query('limit') limit?: string) {
    return this.payout.listRuns(limit ? parseInt(limit, 10) : 20);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Get('payout-runs/:id')
  getPayoutRun(@Param('id') id: string) {
    return this.payout.getRun(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Post('payout-runs')
  createPayoutRun(@Body() body: { periodStart: string; periodEnd: string }) {
    return this.payout.createRun(body.periodStart, body.periodEnd);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Patch('payout-runs/items/:itemId/paid')
  markPayoutItemPaid(@Param('itemId') itemId: string, @Body() body: { reference: string }) {
    return this.payout.markItemPaid(itemId, body.reference);
  }

  // ---- Layer 3: Cancellation ----
  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Post('orders/:orderId/cancel')
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string; role: string };
    const vendorId = await this.getVendorId(req);
    return this.cancellation.cancelOrder(orderId, body.reason, { vendorId: vendorId ?? undefined, isAdmin: user.role === 'admin' });
  }

  private async getVendorId(req: Request): Promise<string | null> {
    const user = req.user as { userId: string };
    const v = await this.vendorsService.findByUserId(user.userId);
    return v?.id ?? null;
  }
}
