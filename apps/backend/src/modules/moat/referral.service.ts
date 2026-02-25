import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { LoyaltyService } from './loyalty.service';
import { v4 as uuidv4 } from 'uuid';

/** Layer 2 — Network Effects: Referral program */
@Injectable()
export class ReferralService {
  constructor(
    private readonly db: DatabaseService,
    private readonly loyalty: LoyaltyService,
  ) {}

  private generateCode(userId: string): string {
    const slug = userId.slice(0, 8).replace(/-/g, '');
    return `MJ2-${slug}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  async getOrCreateCode(userId: string) {
    const existing = await this.db.query(
      'SELECT id, code FROM referral_codes WHERE user_id = $1 LIMIT 1',
      [userId],
    );
    if (existing.rows[0]) {
      return { code: existing.rows[0].code };
    }
    const id = uuidv4();
    const code = this.generateCode(userId);
    await this.db.query(
      'INSERT INTO referral_codes (id, user_id, code) VALUES ($1, $2, $3)',
      [id, userId, code],
    );
    return { code };
  }

  async getMyCode(userId: string) {
    return this.getOrCreateCode(userId);
  }

  async getStats(userId: string) {
    const refs = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM referrals WHERE referrer_id = $1',
      [userId],
    );
    const withOrder = await this.db.query<{ count: string }>(
      'SELECT COUNT(*)::int AS count FROM referrals WHERE referrer_id = $1 AND order_id IS NOT NULL',
      [userId],
    );
    return {
      totalReferred: Number(refs.rows[0]?.count ?? 0),
      referredWhoOrdered: Number(withOrder.rows[0]?.count ?? 0),
    };
  }

  /** Apply referral code (on signup or first order). Returns referrer_id if valid. */
  async applyCode(referredUserId: string, code: string): Promise<{ referrerId: string } | null> {
    const normalized = code.trim().toUpperCase();
    const row = await this.db.query<{ user_id: string }>(
      'SELECT user_id FROM referral_codes WHERE UPPER(code) = $1 LIMIT 1',
      [normalized],
    );
    const referrerId = row.rows[0]?.user_id;
    if (!referrerId || referrerId === referredUserId) return null;
    const existing = await this.db.query(
      'SELECT id FROM referrals WHERE referred_id = $1 LIMIT 1',
      [referredUserId],
    );
    if (existing.rows[0]) return null;
    const id = uuidv4();
    await this.db.query(
      'INSERT INTO referrals (id, referrer_id, referred_id) VALUES ($1, $2, $3)',
      [id, referrerId, referredUserId],
    );
    return { referrerId };
  }

  /** Mark referral as having placed order (and optionally grant reward) */
  async recordReferredOrder(referredUserId: string, orderId: string) {
    const r = await this.db.query<{ referrer_id: string; reward_applied: string }>(
      'SELECT referrer_id, reward_applied FROM referrals WHERE referred_id = $1 LIMIT 1',
      [referredUserId],
    );
    if (!r.rows[0] || r.rows[0].reward_applied === true) return;
    await this.db.query(
      'UPDATE referrals SET order_id = $2, reward_applied = true WHERE referred_id = $1',
      [referredUserId, orderId],
    );
    try {
      await this.loyalty.earnForReferral(r.rows[0].referrer_id, orderId, 50);
    } catch {
      // don't fail if loyalty grant fails
    }
  }
}
