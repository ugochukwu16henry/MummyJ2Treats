import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ReferralService } from '../moat/referral.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly referralService: ReferralService,
  ) {}

  async register(dto: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    role?: 'admin' | 'vendor' | 'customer' | 'rider';
    referralCode?: string;
  }) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const founderEmail = (process.env.FOUNDER_ADMIN_EMAIL || '').toLowerCase().trim();
    const isFounderEmail =
      founderEmail.length > 0 && dto.email.toLowerCase().trim() === founderEmail;
    let role: 'admin' | 'vendor' | 'customer' | 'rider' =
      dto.role ?? 'customer';

    if (isFounderEmail) {
      const hasAdmin = await this.usersService.anyAdminExists();
      if (!hasAdmin) {
        role = 'admin';
      }
    }

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      role,
      passwordHash,
    });

    if (dto.referralCode?.trim()) {
      try {
        await this.referralService.applyCode(user.id, dto.referralCode.trim());
      } catch {
        // don't fail registration if referral apply fails
      }
    }

    const tokens = await this.issueTokens(user.id, user.role);
    return {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.password_hash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(user.id, user.role);
    return {
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refreshFromToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }
      const tokens = await this.issueTokens(payload.sub, payload.role as any);
      return tokens;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async issueTokens(userId: string, role: 'admin' | 'vendor' | 'customer' | 'rider') {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, role, type: 'access' },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, role, type: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }
}
