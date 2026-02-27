import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { VendorsService } from '../vendors/vendors.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('customer', 'vendor', 'admin')
  @Get('me')
  async myOrders(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    if (user.role === 'customer') {
      return this.ordersService.findByCustomerId(user.userId);
    }
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) return { data: [] };
    return this.ordersService.findByVendorId(vendor.id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('customer', 'vendor', 'admin')
  @Get('me/:id')
  async myOrderDetail(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    const order = await this.ordersService.findOne(id);
    if (!order) throw new NotFoundException('Order not found');
    if (user.role === 'customer' && order.customer_id !== user.userId) throw new NotFoundException('Order not found');
    if (user.role === 'vendor' || user.role === 'admin') {
      const vendor = await this.vendorsService.findByUserId(user.userId);
      if (vendor && order.vendor_id !== vendor.id && user.role !== 'admin') throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; cancellationReason?: string },
    @Req() req: Request,
  ) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    const vendorId = vendor?.id;
    const isAdmin = user.role === 'admin';
    return this.ordersService.updateStatus(id, body.status, {
      vendorId,
      isAdmin,
      cancellationReason: body.cancellationReason,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  checkout(
    @Req() req: Request,
    @Body()
    dto: {
      deliveryAddress?: string;
      paymentMethod?: string;
      deliveryState?: string;
      deliveryCity?: string;
      deliveryLga?: string;
      deliveryStreet?: string;
      deliveryLandmark?: string;
      deliveryNotes?: string;
      latitude?: number | null;
      longitude?: number | null;
    },
  ) {
    const user = req.user as { userId: string };
    return this.ordersService.checkout(user.userId, dto);
  }
}
