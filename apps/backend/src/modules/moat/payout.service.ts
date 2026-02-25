import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

/** Layer 3 — Payout automation */
@Injectable()
export class PayoutService {
  constructor(private readonly db: DatabaseService) {}

  async listRuns(limit = 20) {
    const r = await this.db.query(
      'SELECT id, period_start, period_end, status, created_at FROM payout_runs ORDER BY created_at DESC LIMIT $1',
      [limit],
    );
    return { data: r.rows };
  }

  async getRun(runId: string) {
    const run = await this.db.query('SELECT * FROM payout_runs WHERE id = $1', [runId]);
    if (!run.rows[0]) return null;
    const items = await this.db.query(
      'SELECT * FROM payout_run_items WHERE payout_run_id = $1 ORDER BY vendor_id',
      [runId],
    );
    return { ...run.rows[0], items: items.rows };
  }

  /** Create a payout run for a period: sum (commission or vendor share) per vendor */
  async createRun(periodStart: string, periodEnd: string) {
    const runId = uuidv4();
    await this.db.query(
      'INSERT INTO payout_runs (id, period_start, period_end, status) VALUES ($1, $2, $3, $4)',
      [runId, periodStart, periodEnd, 'pending'],
    );
    const vendors = await this.db.query<{ vendor_id: string; total: string }>(
      `SELECT o.vendor_id, (SUM(o.subtotal + COALESCE(o.delivery_fee, 0)) - SUM(COALESCE(o.commission_amount, 0)))::numeric AS total
       FROM orders o
       WHERE o.status = 'DELIVERED' AND o.created_at >= $1 AND o.created_at < ($2::date + INTERVAL '1 day')
       GROUP BY o.vendor_id`,
      [periodStart, periodEnd],
    );
    for (const v of vendors.rows) {
      const amount = Number(v.total);
      if (amount <= 0) continue;
      const itemId = uuidv4();
      await this.db.query(
        'INSERT INTO payout_run_items (id, payout_run_id, vendor_id, amount, status) VALUES ($1, $2, $3, $4, $5)',
        [itemId, runId, v.vendor_id, amount, 'pending'],
      );
    }
    return this.getRun(runId);
  }

  async markItemPaid(itemId: string, reference: string) {
    await this.db.query(
      'UPDATE payout_run_items SET status = $2, paid_at = NOW(), reference = $3 WHERE id = $1',
      [itemId, 'paid', reference],
    );
    return this.db.query('SELECT * FROM payout_run_items WHERE id = $1', [itemId]).then((r) => r.rows[0]);
  }
}
