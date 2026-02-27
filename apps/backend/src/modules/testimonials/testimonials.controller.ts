import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TestimonialsService } from './testimonials.service';
import { VendorsService } from '../vendors/vendors.service';
import { Roles } from '../auth/roles.metadata';
import { Request } from 'express';

@Controller('testimonials')
export class TestimonialsController {
  constructor(
    private readonly testimonials: TestimonialsService,
    private readonly vendors: VendorsService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Roles('customer')
  @Post()
  async create(
    @Req() req: Request,
    @Body()
    body: {
      content: string;
      imageUrl?: string;
      target?: 'founder' | 'vendor';
      vendorSlug?: string;
    },
  ) {
    const user = req.user as { userId: string };
    const target: 'founder' | 'vendor' = body.target === 'vendor' ? 'vendor' : 'founder';
    let vendorId: string | null = null;

    if (target === 'vendor') {
      const slug = (body.vendorSlug ?? '').trim();
      if (!slug) {
        throw new Error('vendorSlug is required for vendor testimonials');
      }
      const vendor = await this.vendors.findBySlug(slug);
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      vendorId = vendor.id;
    }

    return this.testimonials.create({
      userId: user.userId,
      target,
      vendorId,
      content: body.content,
      imageUrl: body.imageUrl,
    });
  }

  @Get('founder')
  listFounder(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 10;
    return this.testimonials.listApprovedForFounder(n);
  }

  @Get('vendor/:slug')
  listForVendor(@Param('slug') slug: string, @Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 10;
    return this.testimonials.listApprovedForVendorSlug(slug, n);
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Get()
  listForAdmin(
    @Query('status') status?: 'pending' | 'approved',
    @Query('target') target?: 'founder' | 'vendor',
  ) {
    return this.testimonials.listForAdmin({ status, target });
  }

  @UseGuards(AuthGuard('jwt'))
  @Roles('admin')
  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.testimonials.approve(id);
  }
}

