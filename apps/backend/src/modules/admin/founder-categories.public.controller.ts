import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('founder-categories')
export class FounderCategoriesPublicController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  list() {
    return this.adminService.listFounderCategories();
  }
}
