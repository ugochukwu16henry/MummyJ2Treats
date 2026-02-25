import { Injectable } from '@nestjs/common';

@Injectable()
export class VendorsService {
  async findAll() {
    return { data: [], message: 'Vendors list (stub)' };
  }

  async findOne(id: string) {
    return {
      id,
      businessName: 'Stub Vendor',
      slug: 'stub-vendor',
      isVerified: true,
      message: 'Vendor (stub)',
    };
  }
}
