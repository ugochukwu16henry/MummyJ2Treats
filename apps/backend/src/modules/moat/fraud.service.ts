import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/** Layer 3 — Fraud detection: simple rule-based risk score (0–100) */
@Injectable()
export class FraudService {
  constructor(private readonly db: DatabaseService) {}

  /** Compute risk score for an order (call after order created) */
  async scoreOrder(orderId: string, customerId: string, totalAmount: number): Promise<number> {
    let score = 0;
    const ordersIn24h = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM orders WHERE customer_id = $1 AND created_at >= NOW() - INTERVAL \'24 hours\'',
      [customerId],
    );
    const count = Number(ordersIn24h.rows[0]?.count ?? 0);
    if (count > 3) score += 25;
    else if (count > 1) score += 10;
    if (totalAmount > 100000) score += 20;
    else if (totalAmount > 50000) score += 10;
    const failedPayments = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM payments p JOIN orders o ON o.id = p.order_id WHERE o.customer_id = $1 AND p.status IN (\'failed\', \'error\')',
      [customerId],
    );
    if (Number(failedPayments.rows[0]?.count ?? 0) > 2) score += 30;
    const final = Math.min(100, score);
    await this.db.query('UPDATE orders SET risk_score = $2 WHERE id = $1', [orderId, final]);
    return final;
  }
}
