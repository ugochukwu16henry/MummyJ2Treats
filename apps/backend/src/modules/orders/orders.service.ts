import { Injectable } from '@nestjs/common';

@Injectable()
export class OrdersService {
  async findAll() {
    return { data: [], message: 'Orders list (stub)' };
  }

  async findOne(id: string) {
    return {
      id,
      status: 'pending',
      total: 5000,
      items: [],
      message: 'Order (stub)',
    };
  }

  async create(dto: Record<string, unknown>) {
    return { id: 'order-stub-1', ...dto, status: 'created', message: 'Order created (stub)' };
  }
}
