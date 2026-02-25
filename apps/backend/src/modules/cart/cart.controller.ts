import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@UseGuards(AuthGuard('jwt'))
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get('me')
  getMyCart(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.cartService.getMyCart(user.userId);
  }

  @Post('items')
  addItem(
    @Req() req: Request,
    @Body() dto: { productId: string; quantity?: number },
  ) {
    const user = req.user as { userId: string };
    return this.cartService.addItem(user.userId, {
      productId: dto.productId,
      quantity: dto.quantity ?? 1,
    });
  }

  @Patch('items/:productId')
  updateItem(
    @Req() req: Request,
    @Param('productId') productId: string,
    @Body() dto: { quantity: number },
  ) {
    const user = req.user as { userId: string };
    return this.cartService.updateItem(user.userId, productId, dto.quantity);
  }
}

