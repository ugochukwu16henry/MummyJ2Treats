import { Controller, Post, Body, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: any) {
    // TODO: Validate DTO, call service
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: any) {
    // TODO: Validate DTO, call service
    return this.authService.login(dto);
  }

  @Post('refresh')
  async refresh(@Body() dto: any) {
    // TODO: Validate DTO, call service
    return this.authService.refresh(dto);
  }
}
