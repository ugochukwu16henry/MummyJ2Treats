import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { VendorsService } from '../vendors/vendors.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { Request } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly vendorsService: VendorsService,
  ) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Get('me')
  async myOrders(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) return { data: [] };
    return this.ordersService.findByVendorId(vendor.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  checkout(
    @Req() req: Request,
    @Body() dto: { deliveryAddress: string; paymentMethod?: string },
  ) {
    const user = req.user as { userId: string };
    return this.ordersService.checkout(user.userId, dto);
  }
}
