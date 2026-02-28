import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('founder')
export class FounderPublicController {
  constructor(private readonly adminService: AdminService) {}

  @Get('profile-picture')
  async getProfilePicture() {
    const url = await this.adminService.getFounderProfilePictureUrl();
    return { url: url ?? null };
  }
}
