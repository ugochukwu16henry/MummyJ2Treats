import { Controller, Get, Param, Query, Body, Post, Patch, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { VendorsService } from '../vendors/vendors.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { Request } from 'express';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly vendorsService: VendorsService,
  ) {}

  @Get()
  findAll(
    @Query('vendorSlug') vendorSlug?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.findAll({
      vendorSlug: vendorSlug || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      isActiveOnly: true,
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Get('me')
  async listMyProducts(@Req() req: Request) {
    const user = req.user as { userId: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) {
      return { data: [] };
    }
    return this.productsService.findByVendorId(vendor.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get('vendor/:slug')
  findByVendorSlug(
    @Param('slug') slug: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.findByVendorSlug(
      slug,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Post('me')
  async createForMe(
    @Req() req: Request,
    @Body()
    dto: {
      name: string;
      description?: string;
      price: number;
      stock?: number;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked. Create a vendor profile to add products.');
    }
    return this.productsService.createForVendor(vendor.id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('vendor', 'admin')
  @Patch('me/:id')
  async updateForMe(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    dto: {
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      isActive?: boolean;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    return this.productsService.updateForVendor(vendor.id, id, dto);
  }
}
