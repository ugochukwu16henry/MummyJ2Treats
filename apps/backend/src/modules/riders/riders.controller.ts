import { Controller, Get, Post, Patch, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RidersService } from './riders.service';
import { VendorsService } from '../vendors/vendors.service';
import { Request } from 'express';

@Controller('riders')
export class RidersController {
  constructor(
    private readonly ridersService: RidersService,
    private readonly vendorsService: VendorsService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Roles('rider')
  @Post('register')
  register(
    @Req() req: Request,
    @Body() dto: { phone?: string; state: string; cities?: string[]; transportType?: 'bike' | 'car' | 'motorcycle' | 'other' },
  ) {
    const user = req.user as { userId: string };
    return this.ridersService.create(user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('rider')
  @Get('me')
  async myProfile(@Req() req: Request) {
    const user = req.user as { userId: string };
    const rider = await this.ridersService.findByUserId(user.userId);
    return rider ?? { message: 'No rider profile. POST /riders/register to create.' };
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('rider')
  @Patch('me')
  async updateProfile(
    @Req() req: Request,
    @Body() dto: { phone?: string; state?: string; cities?: string[]; transportType?: 'bike' | 'car' | 'motorcycle' | 'other'; isAvailable?: boolean },
  ) {
    const user = req.user as { userId: string };
    const rider = await this.ridersService.findByUserId(user.userId);
    if (!rider) return { message: 'No rider profile.' };
    return this.ridersService.updateProfile(rider.id, user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('rider')
  @Patch('me/location')
  async updateLocation(
    @Req() req: Request,
    @Body() body: { latitude: number; longitude: number; orderId?: string },
  ) {
    const user = req.user as { userId: string };
    const rider = await this.ridersService.findByUserId(user.userId);
    if (!rider) return { message: 'No rider profile.' };
    return this.ridersService.updateLocation(rider.id, user.userId, body.latitude, body.longitude, body.orderId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Get('by-state')
  listByState(@Query('state') state: string, @Query('available') available?: string) {
    if (!state) return { data: [] };
    return this.ridersService.listByState(state, available === 'true');
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Get()
  listAll(@Query('available') available?: string) {
    return this.ridersService.listAll(available === 'true');
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Patch('orders/:orderId/assign')
  async assignRider(
    @Param('orderId') orderId: string,
    @Body() body: { riderId: string },
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    const vendorId = vendor?.id;
    const isAdmin = user.role === 'admin';
    return this.ridersService.assignToOrder(orderId, body.riderId, vendorId, isAdmin);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':riderId/location')
  getLocation(@Param('riderId') riderId: string) {
    return this.ridersService.getLocation(riderId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':riderId/route/:orderId')
  getRouteHistory(@Param('riderId') riderId: string, @Param('orderId') orderId: string, @Query('limit') limit?: string) {
    return this.ridersService.getRouteHistory(riderId, orderId, limit ? parseInt(limit, 10) : 200);
  }
}
