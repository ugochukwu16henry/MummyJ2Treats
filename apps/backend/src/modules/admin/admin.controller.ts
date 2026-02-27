import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
