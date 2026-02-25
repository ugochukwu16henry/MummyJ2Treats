import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  async findAll() {
    return { data: [], message: 'Products list (stub)' };
  }

  async findOne(id: string) {
    return {
      id,
      name: 'Stub Product',
      slug: 'stub-product',
      price: 2500,
      vendorId: 'vendor-1',
      isActive: true,
      message: 'Product (stub)',
    };
  }
}
