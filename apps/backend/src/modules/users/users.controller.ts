import { Controller, Get, Patch, Param, Body, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.metadata';
import { RolesGuard } from '../auth/roles.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('customer', 'vendor', 'rider', 'admin')
  @Get('me/deletion-status')
  getMyDeletionStatus(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.usersService.getDeletionStatus(user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('customer', 'vendor', 'rider')
  @Post('me/request-deletion')
  requestDeletion(@Req() req: Request) {
    const user = req.user as { userId: string };
    return this.usersService.requestAccountDeletion(user.userId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('customer', 'vendor', 'rider')
  @Post('me/cancel-deletion')
  cancelDeletion(@Req() req: Request) {
    const user = req.user as { userId: string };
    const ok = this.usersService.cancelDeletion(user.userId);
    return ok.then((cancelled) => (cancelled ? { cancelled: true } : { cancelled: false }));
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Record<string, unknown>) {
    return this.usersService.update(id, dto);
  }
}
