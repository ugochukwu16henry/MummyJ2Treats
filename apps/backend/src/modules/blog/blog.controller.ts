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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BlogService, BlogPostSummary, BlogPostDetail } from './blog.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';
import { VendorsService } from '../vendors/vendors.service';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @Get('me')
  async listMyPosts(
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const user = req.user as { userId: string; role: string } | undefined;
    if (!user) {
      throw new ForbiddenException('Missing user');
    }
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    return this.blogService.listPostsForVendor(
      vendor.id,
      limit ? Number(limit) : 100,
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
    // Vendors can edit content and metadata, but founder admin controls final publishing.
    // Ignore any direct status changes; use submitForReview + adminApprove instead.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { status: _ignoredStatus, ...rest } = dto;
    return this.blogService.updateDraftForVendor(vendor.id, id, rest);
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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('vendor', 'admin')
  @Post('me/:id/upload-video')
  @UseInterceptors(FileInterceptor('file', { dest: 'uploads/blog-videos' }))
  async uploadVideoForPost(
    @Req() req: Request,
    @Param('id') id: string,
    @UploadedFile() file?: any,
  ) {
    const user = req.user as { userId: string; role: string } | undefined;
    if (!user) {
      throw new ForbiddenException('Missing user');
    }
    const vendor = await this.vendorsService.findByUserId(user.userId);
    if (!vendor) {
      throw new ForbiddenException('No vendor account linked.');
    }
    if (!file) {
      throw new ForbiddenException('File is required');
    }
    const relative = `/uploads/blog-videos/${file.filename}`;
    return this.blogService.attachUploadedMediaForVendor(
      vendor.id,
      id,
      relative,
      'upload',
    );
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

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('admin/:id/delete')
  adminDelete(@Param('id') id: string) {
    return this.blogService.adminDelete(id);
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

