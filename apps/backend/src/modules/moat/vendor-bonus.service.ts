import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

/** Layer 2 — Vendor performance bonuses */
@Injectable()
export class VendorBonusService {
  constructor(private readonly db: DatabaseService) {}

  async listForVendor(vendorId: string) {
    const r = await this.db.query(
      'SELECT id, period_date, amount, criteria, status, created_at FROM vendor_bonuses WHERE vendor_id = $1 ORDER BY period_date DESC LIMIT 30',
      [vendorId],
    );
    return { data: r.rows };
  }

  /** Admin: create a bonus for a vendor */
  async create(vendorId: string, periodDate: string, amount: number, criteria: string) {
    const id = uuidv4();
    await this.db.query(
      'INSERT INTO vendor_bonuses (id, vendor_id, period_date, amount, criteria, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [id, vendorId, periodDate, amount, criteria, 'pending'],
    );
    const r = await this.db.query('SELECT * FROM vendor_bonuses WHERE id = $1', [id]);
    return r.rows[0];
  }

  /** Compute suggested bonuses for a period (e.g. top performers by fulfillment + volume) */
  async computeSuggestions(periodDate: string) {
    const start = `${periodDate.slice(0, 7)}-01`;
    const end = new Date(periodDate);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    const endStr = end.toISOString().slice(0, 10);
    const r = await this.db.query<{ vendor_id: string; delivered: string; total: string; gmv: string }>(
      `SELECT o.vendor_id,
        COUNT(*) FILTER (WHERE o.status = 'DELIVERED')::int AS delivered,
        COUNT(*)::int AS total,
        COALESCE(SUM(o.total_amount) FILTER (WHERE o.status != 'CANCELLED'), 0)::numeric AS gmv
       FROM orders o
       WHERE o.created_at >= $1 AND o.created_at <= $2
       GROUP BY o.vendor_id
       HAVING COUNT(*) FILTER (WHERE o.status = 'DELIVERED')::float / NULLIF(COUNT(*), 0) >= 0.9
       ORDER BY gmv DESC
       LIMIT 10`,
      [start, endStr],
    );
    return {
      periodDate,
      suggestions: r.rows.map((row) => ({
        vendorId: row.vendor_id,
        fulfillmentRate: (Number(row.delivered) / Number(row.total)) * 100,
        orderCount: Number(row.total),
        gmv: Number(row.gmv),
      })),
    };
  }
}
