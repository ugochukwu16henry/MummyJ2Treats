import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/** Layer 3 — Smart cancellation handling */
@Injectable()
export class CancellationService {
  constructor(private readonly db: DatabaseService) {}

  /** Cancel order with reason; optionally enforce policy (e.g. no cancel after PREPARING) */
  async cancelOrder(orderId: string, reason: string, opts?: { vendorId?: string; isAdmin?: boolean }) {
    const order = await this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]).then((r) => r.rows[0]);
    if (!order) throw new BadRequestException('Order not found');
    if (order.status === 'CANCELLED') throw new BadRequestException('Already cancelled');
    if (opts?.vendorId && order.vendor_id !== opts.vendorId && !opts.isAdmin) {
      throw new BadRequestException('Not your order');
    }
    const allowed = ['PENDING', 'PAID', 'PREPARING'].includes(order.status);
    if (!allowed && !opts?.isAdmin) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }
    await this.db.query(
      'UPDATE orders SET status = $2, cancellation_reason = $3 WHERE id = $1',
      [orderId, 'CANCELLED', reason],
    );
    return this.db.query('SELECT * FROM orders WHERE id = $1', [orderId]).then((r) => r.rows[0]);
  }
}
