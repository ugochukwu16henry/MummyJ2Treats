import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  async createIntent(dto: { amount: number; currency?: string; orderId?: string }) {
    return {
      clientSecret: 'stub_secret_' + Date.now(),
      amount: dto.amount,
      currency: dto.currency ?? 'NGN',
      message: 'Payment intent created (stub)',
    };
  }

  async verify(reference: string) {
    return { reference, status: 'success', message: 'Payment verified (stub)' };
  }
}
