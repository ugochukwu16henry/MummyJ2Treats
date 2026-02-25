import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

/** Layer 2 — Network Effects: Loyalty points */
@Injectable()
export class LoyaltyService {
  constructor(private readonly db: DatabaseService) {}

  private readonly POINTS_PER_NAIRA = 1; // e.g. 1 point per ₦100 spent
  private readonly NAIRA_PER_POINT = 100;

  async getBalance(userId: string): Promise<{ points: number }> {
    const r = await this.db.query<{ points: string }>(
      'SELECT points FROM loyalty_balances WHERE user_id = $1 LIMIT 1',
      [userId],
    );
    const points = r.rows[0] ? Number(r.rows[0].points) : 0;
    return { points };
  }

  async getTransactions(userId: string, limit = 20) {
    const r = await this.db.query(
      'SELECT id, amount, reason, order_id, created_at FROM loyalty_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
      [userId, limit],
    );
    return { data: r.rows };
  }

  private async ensureBalance(userId: string) {
    const r = await this.db.query('SELECT user_id FROM loyalty_balances WHERE user_id = $1', [userId]);
    if (!r.rows[0]) {
      await this.db.query('INSERT INTO loyalty_balances (user_id, points) VALUES ($1, 0)', [userId]);
    }
  }

  /** Award points for order (e.g. 1 point per ₦100) */
  async earnForOrder(userId: string, orderId: string, totalAmountNaira: number) {
    await this.ensureBalance(userId);
    const points = Math.floor(totalAmountNaira / this.NAIRA_PER_POINT) * this.POINTS_PER_NAIRA;
    if (points <= 0) return { points: 0 };
    const id = uuidv4();
    await this.db.query(
      'INSERT INTO loyalty_transactions (id, user_id, amount, reason, order_id) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, points, 'order', orderId],
    );
    await this.db.query(
      'UPDATE loyalty_balances SET points = points + $2, updated_at = NOW() WHERE user_id = $1',
      [userId, points],
    );
    return { points };
  }

  /** Award points for referral (e.g. 50 points when referred customer places order) */
  async earnForReferral(userId: string, referredOrderId: string, points = 50) {
    await this.ensureBalance(userId);
    const id = uuidv4();
    await this.db.query(
      'INSERT INTO loyalty_transactions (id, user_id, amount, reason, reference_id) VALUES ($1, $2, $3, $4, $5)',
      [id, userId, points, 'referral', referredOrderId],
    );
    await this.db.query(
      'UPDATE loyalty_balances SET points = points + $2, updated_at = NOW() WHERE user_id = $1',
      [userId, points],
    );
    return { points };
  }
}
