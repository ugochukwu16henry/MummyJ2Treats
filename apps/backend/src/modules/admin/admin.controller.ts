import { Controller, Get, Post, Patch, Delete, Param, Query, Body, Req, UseGuards, UseInterceptors, UploadedFile, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { ProductsService } from '../products/products.service';
import { VendorsService } from '../vendors/vendors.service';
import { UsersService } from '../users/users.service';
import { RidersService } from '../riders/riders.service';
import { StorageService } from '../storage/storage.service';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly productsService: ProductsService,
    private readonly vendorsService: VendorsService,
    private readonly usersService: UsersService,
    private readonly ridersService: RidersService,
    private readonly storageService: StorageService,
  ) {}

  @Get('me/profile-picture')
  async getProfilePicture(@Req() req: Request) {
    const user = req.user as { userId: string };
    const url = await this.adminService.getAdminProfilePictureUrl(user.userId);
    if (!url) return { url: null };
    return { url };
  }

  @Post('me/profile-picture')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadProfilePicture(
    @Req() req: Request,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = req.user as { userId: string };
    if (!file || !file.buffer) throw new ForbiddenException('File is required');
    const url = await this.storageService.upload(
      file.buffer,
      'founder-admin',
      file.originalname || 'image',
      file.mimetype,
    );
    await this.adminService.setAdminProfilePicture(user.userId, url);
    return { url };
  }

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
  }

  @Post('support-tickets')
  createSupportTicket(
    @Body()
    dto: {
      subject: string;
      body?: string;
      orderId?: string;
      customerId?: string;
    },
  ) {
    return this.adminService.createSupportTicket(dto);
  }

  @Get('support-tickets')
  listSupportTickets(
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listSupportTickets({
      status: status as 'open' | 'closed' | undefined,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  @Post('platform-metrics')
  upsertPlatformMetrics(
    @Body()
    dto: {
      periodDate: string;
      periodType: 'day' | 'month';
      trafficOrganic?: number;
      trafficPaid?: number;
      cpc?: number;
      cpa?: number;
      cac?: number;
      referralCount?: number;
    },
  ) {
    return this.adminService.upsertPlatformMetrics(dto);
  }

  @Get('platform-metrics')
  getPlatformMetrics(
    @Query('periodDate') periodDate?: string,
    @Query('periodType') periodType?: 'day' | 'month',
  ) {
    return this.adminService.getPlatformMetrics(periodDate, periodType as 'day' | 'month' | undefined);
  }

  @Get('charts')
  getCharts(@Query('period') period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    return this.adminService.getCharts({ period });
  }

  @Get('revenue-trend')
  getRevenueTrend() {
    return this.adminService.getRevenueTrend();
  }

  @Get('vendors-heatmap')
  getVendorsHeatmap() {
    return this.adminService.getVendorsHeatmap();
  }

  @Get('cities')
  getCityAnalytics() {
    return this.adminService.getCityAnalytics();
  }

  @Get('cohorts')
  getCohortRetention() {
    return this.adminService.getCohortRetention();
  }

  @Get('delivery-map')
  getDeliveryMap() {
    return this.adminService.getDeliveryMapData();
  }

  @Get('products')
  listAllProducts() {
    return this.productsService.findAll({
      isActiveOnly: false,
      limit: 5000,
      offset: 0,
    });
  }

  @Get('founder-categories')
  listFounderCategories() {
    return this.adminService.listFounderCategories();
  }

  @Delete('vendors/:id')
  async deleteVendor(@Param('id') id: string) {
    const ok = await this.vendorsService.deleteVendor(id);
    if (!ok) throw new ForbiddenException('Vendor not found');
    return { ok: true };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    const ok = await this.usersService.deleteUser(id);
    if (!ok) throw new ForbiddenException('User not found');
    return { ok: true };
  }

  @Delete('riders/:id')
  async deleteRider(@Param('id') id: string) {
    const ok = await this.ridersService.deleteRider(id);
    if (!ok) throw new ForbiddenException('Rider not found');
    return { ok: true };
  }

  @Post('purge-scheduled-deletions')
  async purgeScheduledDeletions() {
    return this.usersService.purgeScheduledDeletions();
  }

  @Post('founder-categories')
  createFounderCategory(
    @Body() dto: { name: string; slug: string; description?: string; imageUrl?: string },
  ) {
    return this.adminService.createFounderCategory(dto);
  }

  @Patch('founder-categories/:id')
  updateFounderCategory(
    @Param('id') id: string,
    @Body() dto: { name?: string; slug?: string; description?: string; imageUrl?: string },
  ) {
    return this.adminService.updateFounderCategory(id, dto);
  }

  @Delete('founder-categories/:id')
  async deleteFounderCategory(@Param('id') id: string) {
    const ok = await this.adminService.deleteFounderCategory(id);
    if (!ok) throw new ForbiddenException('Category not found');
    return { ok: true };
  }

  @Post('founder-categories/:id/image')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadFounderCategoryImage(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file || !file.buffer) throw new ForbiddenException('File is required');
    const url = await this.storageService.upload(
      file.buffer,
      'founder-categories',
      file.originalname || 'image',
      file.mimetype,
    );
    const updated = await this.adminService.updateFounderCategory(id, { imageUrl: url });
    if (!updated) throw new ForbiddenException('Category not found');
    return { url };
  }
}
