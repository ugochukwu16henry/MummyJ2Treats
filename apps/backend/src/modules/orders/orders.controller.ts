import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('checkout')
  checkout(
    @Req() req: Request,
    @Body() dto: { deliveryAddress: string },
  ) {
    const user = req.user as { userId: string };
    return this.ordersService.checkout(user.userId, dto);
  }
}
