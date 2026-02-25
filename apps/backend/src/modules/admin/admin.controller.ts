import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AuthGuard('jwt'))
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics')
  getMetrics() {
    return this.adminService.getMetrics();
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
}
