import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}

  @Post('subscribe')
  async subscribe(
    @Body()
    body: {
      email: string;
    },
  ) {
    return this.newsletter.subscribe(body.email);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get()
  async listAll(@Query('limit') limit?: string) {
    const n = limit ? parseInt(limit, 10) : 500;
    return this.newsletter.listAll(n);
  }
}

