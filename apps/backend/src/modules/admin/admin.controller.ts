import { Controller, Get, Post, Query, Body, Req, UseGuards, UseInterceptors, UploadedFile, ForbiddenException } from '@nestjs/common';
import { File as MulterFile } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('me/profile-picture')
  async getProfilePicture(@Req() req: Request) {
    const user = req.user as { userId: string };
    const url = await this.adminService.getAdminProfilePictureUrl(user.userId);
    if (!url) return { url: null };
    return { url };
  }

  @Post('me/profile-picture')
  @UseInterceptors(FileInterceptor('file', { dest: 'uploads/founder-admin' }))
  async uploadProfilePicture(
    @Req() req: Request,
    @UploadedFile() file?: MulterFile,
  ) {
    const user = req.user as { userId: string };
    if (!file) throw new ForbiddenException('File is required');
    const relative = `/uploads/founder-admin/${file.filename}`;
    await this.adminService.setAdminProfilePicture(user.userId, relative);
    return { url: relative };
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
}
