import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async register(dto: any) {
    // TODO: Hash password, create user, return tokens
    return { message: 'Register endpoint' };
  }

  async login(dto: any) {
    // TODO: Validate user, check password, return tokens
    return { message: 'Login endpoint' };
  }

  async refresh(dto: any) {
    // TODO: Validate refresh token, rotate, return new tokens
    return { message: 'Refresh endpoint' };
  }
}
