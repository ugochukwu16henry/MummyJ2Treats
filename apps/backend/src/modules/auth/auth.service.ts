import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ReferralService } from '../moat/referral.service';
import { VendorsService } from '../vendors/vendors.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly referralService: ReferralService,
    private readonly vendorsService: VendorsService,
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

  /** Upgrade a logged-in user to vendor: create vendor row + switch role + issue new tokens */
  async becomeVendor(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Ensure vendor record exists
    let vendor = await this.vendorsService.findByUserId(userId);
    if (!vendor) {
      const baseName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email.split('@')[0];
      const businessName = baseName || 'New Vendor';
      const slugBase = (baseName || businessName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `vendor-${user.id.slice(0, 8)}`;
      let slug = slugBase;
      let suffix = 1;
      // Ensure unique slug
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const existing = await this.vendorsService.findBySlug(slug);
        if (!existing) break;
        slug = `${slugBase}-${suffix++}`;
      }
      vendor = await this.vendorsService.createVendorForUser({
        userId,
        businessName,
        slug,
      });
    }

    if (user.role !== 'vendor') {
      await this.usersService.update(userId, { role: 'vendor' });
    }

    const tokens = await this.issueTokens(userId, 'vendor');
    return {
      vendor,
      ...tokens,
    };
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
