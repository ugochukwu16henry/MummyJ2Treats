import { Controller, Get, Param, Query, Body, Post, Patch, Delete, Req, UseGuards, UseInterceptors, UploadedFile, ForbiddenException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { VendorsService } from '../vendors/vendors.service';
import { StorageService } from '../storage/storage.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly vendorsService: VendorsService,
    private readonly storageService: StorageService,
  ) {}

  @Get()
  findAll(
    @Query('vendorSlug') vendorSlug?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.findAll({
      vendorSlug: vendorSlug || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      category: category || undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      isActiveOnly: true,
    });
  }

  @Get('categories')
  listCategories() {
    return this.productsService.listCategories();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Get('me')
  async listMyProducts(@Req() req: Request) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
      category?: string;
      sizeLabel?: string;
      ingredients?: string;
      nutritionalInfo?: string;
      imageUrl?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked. Create a vendor profile to add products.');
    }
    return this.productsService.createForVendor(vendor.id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
      category?: string;
      sizeLabel?: string;
      ingredients?: string;
      nutritionalInfo?: string;
      imageUrl?: string;
    },
  ) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    return this.productsService.updateForVendor(vendor.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Delete('me/:id')
  async deleteForMe(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    const deleted = await this.productsService.deleteForVendor(vendor.id, id);
    if (!deleted) throw new ForbiddenException('Product not found or not yours.');
    return { ok: true };
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Post('me/:id/image')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadProductImage(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const user = req.user as { userId: string; role: string };
    let vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor && user.role === 'admin') {
      vendor = await this.vendorsService.ensureFounderVendorForUser(user.userId);
    }
    if (!vendor) throw new ForbiddenException('No vendor account linked.');
    if (!file || !file.buffer) throw new ForbiddenException('File is required');
    const url = await this.storageService.upload(
      file.buffer,
      'products',
      file.originalname || 'image',
      file.mimetype,
    );
    const updated = await this.productsService.updateForVendor(vendor.id, id, { imageUrl: url });
    if (!updated) throw new ForbiddenException('Product not found or not yours.');
    return { url };
  }
}
