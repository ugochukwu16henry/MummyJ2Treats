import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  async findAll() {
    return { data: [], message: 'Users list (stub)' };
  }

  async findOne(id: string) {
    return { id, email: 'user@example.com', role: 'customer', message: 'User (stub)' };
  }

  async update(id: string, dto: Record<string, unknown>) {
    return { id, ...dto, message: 'User updated (stub)' };
  }
}
