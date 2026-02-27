import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { BlogService, BlogPostSummary, BlogPostDetail } from './blog.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';
import { VendorsService } from '../vendors/vendors.service';

@Controller('blog')
export class BlogController {
  constructor(
    private readonly blogService: BlogService,
    private readonly vendorsService: VendorsService,
  ) {}

  // Public endpoints

  @Get()
  listPublic(
    @Query('q') search?: string,
    @Query('vendorSlug') vendorSlug?: string,
    @Query('category') category?: string,
    @Query('state') state?: string,
    @Query('city') city?: string,
    @Query('sort') sort?: 'recent' | 'popular',
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ data: BlogPostSummary[] }> {
    return this.blogService.listPublicPosts({
      search: search || undefined,
      vendorSlug: vendorSlug || undefined,
      category: category || undefined,
      state: state || undefined,
      city: city || undefined,
      sort: sort || undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get('slug/:slug')
  getBySlug(@Param('slug') slug: string): Promise<BlogPostDetail | null> {
    return this.blogService.getPublicPostBySlug(slug);
  }

  @Get('author/:vendorSlug')
  getByAuthor(
    @Param('vendorSlug') vendorSlug: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ data: BlogPostSummary[] }> {
    return this.blogService.listPublicPostsByAuthorSlug(
      vendorSlug,
      limit ? Number(limit) : 20,
      offset ? Number(offset) : 0,
    );
  }

  // Vendor / founder author endpoints

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Post('me')
  async createForMe(
    @Req() req: Request,
    @Body()
    dto: {
      title: string;
      content: string;
      excerpt?: string;
      category?: string;
      locationState?: string;
      locationCity?: string;
      featuredImageUrl?: string;
      readingTimeMinutes?: number;
      seoTitle?: string;
      seoDescription?: string;
      ogImageUrl?: string;
      mediaEmbeds?: { provider?: string; url: string }[];
    },
  ) {
    const user = req.user as { userId: string; role: string } | undefined;
    if (!user) {
      throw new ForbiddenException('Missing user');
    }
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked. Create a vendor profile to write blog posts.');
    }
    return this.blogService.createDraftForVendor(vendor.id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Patch('me/:id')
  async updateForMe(
    @Req() req: Request,
    @Param('id') id: string,
    @Body()
    dto: {
      title?: string;
      content?: string;
      excerpt?: string | null;
      category?: string | null;
      locationState?: string | null;
      locationCity?: string | null;
      featuredImageUrl?: string | null;
      readingTimeMinutes?: number | null;
      seoTitle?: string | null;
      seoDescription?: string | null;
      ogImageUrl?: string | null;
      status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
      mediaEmbeds?: { provider?: string; url: string }[];
    },
  ) {
    const user = req.user as { userId: string; role: string } | undefined;
    if (!user) {
      throw new ForbiddenException('Missing user');
    }
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    return this.blogService.updateDraftForVendor(vendor.id, id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Post('me/:id/submit')
  async submitForReview(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { userId: string; role: string } | undefined;
    if (!user) {
      throw new ForbiddenException('Missing user');
    }
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    return this.blogService.submitForReview(vendor.id, id);
  }

  // Admin moderation endpoints

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('admin/posts')
  adminList(
    @Query('status') status?: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED',
    @Query('vendorSlug') vendorSlug?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.blogService.adminListPosts({
      status: status || undefined,
      vendorSlug: vendorSlug || undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('admin/:id/approve')
  adminApprove(@Param('id') id: string) {
    return this.blogService.adminApprove(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('admin/:id/reject')
  adminReject(@Param('id') id: string) {
    return this.blogService.adminReject(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('admin/:id/archive')
  adminArchive(@Param('id') id: string) {
    return this.blogService.adminArchive(id);
  }

  // Subscriptions

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('customer', 'vendor', 'admin', 'rider')
  @Post('subscribe/author/:vendorId')
  subscribeAuthor(@Req() req: Request, @Param('vendorId') vendorId: string) {
    const user = req.user as { userId: string } | undefined;
    if (!user) {
      throw new ForbiddenException('Missing user');
    }
    return this.blogService.subscribeToAuthor(user.userId, vendorId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('customer', 'vendor', 'admin', 'rider')
  @Post('subscribe/global')
  subscribeGlobal(@Req() req: Request) {
    const user = req.user as { userId: string } | undefined;
    if (!user) {
      throw new ForbiddenException('Missing user');
    }
    return this.blogService.subscribeToGlobal(user.userId);
  }
}

