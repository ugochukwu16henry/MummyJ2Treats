import { Controller, Post, Body, Res, Req, UnauthorizedException, UseGuards, Get } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('login')
  async login(@Body() dto: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.refresh_token || (req.body as any)?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const result = await this.authService.refreshFromToken(token);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: Request) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('become-vendor')
  async becomeVendor(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { userId: string; role: string } | undefined;
    if (!user) {
      throw new UnauthorizedException('Missing user');
    }
    const result = await this.authService.becomeVendor(user.userId);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
