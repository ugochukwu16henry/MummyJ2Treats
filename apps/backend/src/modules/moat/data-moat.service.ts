import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/** Layer 1 — Data Moat: Vendor ranking, recommendations, delivery heatmap */
@Injectable()
export class DataMoatService {
  constructor(private readonly db: DatabaseService) {}

  /** Smart vendor ranking: fulfillment rate, delivery speed, cancellation rate, volume, recency */
  async getRankedVendors(limit = 20) {
    const periodStart = new Date();
    periodStart.setMonth(periodStart.getMonth() - 3);
    const result = await this.db.query<{
      vendor_id: string;
      business_name: string;
      slug: string;
      order_count: string;
      delivered: string;
      cancelled: string;
      avg_hours: string;
    }>(
      `SELECT
        v.id AS vendor_id,
        v.business_name,
        v.slug,
        COUNT(o.id)::int AS order_count,
        COUNT(o.id) FILTER (WHERE o.status = 'DELIVERED')::int AS delivered,
        COUNT(o.id) FILTER (WHERE o.status = 'CANCELLED')::int AS cancelled,
        EXTRACT(EPOCH FROM AVG(o.delivered_at - o.created_at) FILTER (WHERE o.delivered_at IS NOT NULL)) / 3600 AS avg_hours
       FROM vendors v
       LEFT JOIN orders o ON o.vendor_id = v.id AND o.created_at >= $1
       GROUP BY v.id, v.business_name, v.slug
       HAVING COUNT(o.id) > 0
       ORDER BY
         (COUNT(o.id) FILTER (WHERE o.status = 'DELIVERED')::float / NULLIF(COUNT(o.id), 0)) DESC NULLS LAST,
         AVG(o.delivered_at - o.created_at) FILTER (WHERE o.delivered_at IS NOT NULL) ASC NULLS LAST,
         COUNT(o.id) DESC
       LIMIT $2`,
      [periodStart.toISOString(), limit],
    );
    return { data: result.rows.map((r: { vendor_id: string; business_name: string; slug: string; order_count: string; delivered: string; cancelled: string; avg_hours: string | null }) => ({
      vendorId: r.vendor_id,
      businessName: r.business_name,
      slug: r.slug,
      orderCount: Number(r.order_count),
      fulfillmentRate: r.order_count ? (Number(r.delivered) / Number(r.order_count)) * 100 : 0,
      cancellationRate: r.order_count ? (Number(r.cancelled) / Number(r.order_count)) * 100 : 0,
      avgDeliveryHours: r.avg_hours != null ? Math.round(Number(r.avg_hours) * 100) / 100 : null,
    })) };
  }

  /** AI-style recommendations: for a customer, recommend products from vendors they ordered from + popular */
  async getRecommendationsForCustomer(customerId: string, limit = 10) {
    const byVendor = await this.db.query<{ product_id: string; name: string; slug: string; vendor_slug: string; price: string }>(
      `SELECT p.id AS product_id, p.name, p.slug, v.slug AS vendor_slug, p.price
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.is_active = true
         AND v.id IN (
           SELECT DISTINCT o.vendor_id FROM orders o
           WHERE o.customer_id = $1 AND o.status != 'CANCELLED'
         )
         AND p.id NOT IN (
           SELECT oi.product_id FROM order_items oi
           JOIN orders o ON o.id = oi.order_id AND o.customer_id = $1
         )
       ORDER BY p.created_at DESC
       LIMIT $2`,
      [customerId, limit],
    );
    const popular = await this.db.query<{ product_id: string; name: string; slug: string; vendor_slug: string; price: string }>(
      `SELECT p.id AS product_id, p.name, p.slug, v.slug AS vendor_slug, p.price
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.is_active = true
         AND (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) > 0
       ORDER BY (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) DESC
       LIMIT $1`,
      [limit],
    );
    const recs = byVendor.rows.length > 0 ? byVendor.rows : popular.rows;
    return {
      data: recs.slice(0, limit).map((r: { product_id: string; name: string; slug: string; vendor_slug: string; price: string }) => ({
        productId: r.product_id,
        name: r.name,
        slug: r.slug,
        vendorSlug: r.vendor_slug,
        price: Number(r.price),
      })),
    };
  }

  /** Public recommendations (no customer): top products by order count */
  async getPublicRecommendations(limit = 10) {
    const result = await this.db.query<{ product_id: string; name: string; slug: string; vendor_slug: string; price: string; orders: string }>(
      `SELECT p.id AS product_id, p.name, p.slug, v.slug AS vendor_slug, p.price,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.product_id = p.id) AS orders
       FROM products p
       JOIN vendors v ON v.id = p.vendor_id
       WHERE p.is_active = true
       ORDER BY orders DESC
       LIMIT $1`,
      [limit],
    );
    return {
      data: result.rows.map((r: { product_id: string; name: string; slug: string; vendor_slug: string; price: string }) => ({
        productId: r.product_id,
        name: r.name,
        slug: r.slug,
        vendorSlug: r.vendor_slug,
        price: Number(r.price),
      })),
    };
  }

  /** Delivery heatmap: demand by region (city) for admin */
  async getDeliveryHeatmap(periodDays = 30) {
    const result = await this.db.query<{ region_key: string; order_count: string; total_amount: string }>(
      `SELECT
        COALESCE(TRIM(SPLIT_PART(o.delivery_address, ',', 1)), 'Unknown') AS region_key,
        COUNT(*)::int AS order_count,
        COALESCE(SUM(o.total_amount), 0)::numeric AS total_amount
       FROM orders o
       WHERE o.status != 'CANCELLED' AND o.delivery_address IS NOT NULL
         AND o.created_at >= NOW() - ($1 || ' days')::interval
       GROUP BY region_key
       ORDER BY total_amount DESC`,
      [String(periodDays)],
    );
    return {
      periodDays,
      data: result.rows.map((r: { region_key: string; order_count: string; total_amount: string }) => ({
        region: r.region_key,
        orderCount: Number(r.order_count),
        totalAmount: Number(r.total_amount),
      })),
    };
  }

  /** Refresh cached vendor reliability scores for a given month */
  async refreshVendorReliability(periodDate: string) {
    await this.db.query(
      `INSERT INTO vendor_reliability_scores (
        vendor_id, period_date, fulfillment_rate, avg_delivery_hours, cancellation_rate, order_count, composite_score, updated_at
      )
      SELECT
        v.id,
        $1::date,
        (COUNT(o.id) FILTER (WHERE o.status = 'DELIVERED')::float / NULLIF(COUNT(o.id), 0)),
        EXTRACT(EPOCH FROM AVG(o.delivered_at - o.created_at) FILTER (WHERE o.delivered_at IS NOT NULL)) / 3600,
        (COUNT(o.id) FILTER (WHERE o.status = 'CANCELLED')::float / NULLIF(COUNT(o.id), 0)),
        COUNT(o.id)::int,
        (
          COALESCE(COUNT(o.id) FILTER (WHERE o.status = 'DELIVERED')::float / NULLIF(COUNT(o.id), 0), 0) * 0.5
          - COALESCE(COUNT(o.id) FILTER (WHERE o.status = 'CANCELLED')::float / NULLIF(COUNT(o.id), 0), 0) * 0.3
          + LEAST(1, COUNT(o.id)::float / 50) * 0.2
        ),
        NOW()
      FROM vendors v
      LEFT JOIN orders o ON o.vendor_id = v.id
        AND o.created_at >= $1::date
        AND o.created_at < ($1::date + INTERVAL '1 month')
      GROUP BY v.id
      ON CONFLICT (vendor_id, period_date) DO UPDATE SET
        fulfillment_rate = EXCLUDED.fulfillment_rate,
        avg_delivery_hours = EXCLUDED.avg_delivery_hours,
        cancellation_rate = EXCLUDED.cancellation_rate,
        order_count = EXCLUDED.order_count,
        composite_score = EXCLUDED.composite_score,
        updated_at = NOW()`,
      [periodDate],
    );
    return { updated: true, periodDate };
  }
}
