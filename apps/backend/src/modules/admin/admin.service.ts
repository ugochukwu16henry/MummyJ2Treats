import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AdminService {
  constructor(private readonly db: DatabaseService) {}

  /** Single comprehensive metrics payload for Founder Admin Dashboard */
  async getMetrics() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // ---- A. Revenue ----
    const gmvResult = await this.db.query<{ gmv: string; net: string; count: string }>(
      `SELECT
        COALESCE(SUM(total_amount), 0)::numeric AS gmv,
        COALESCE(SUM(commission_amount), 0)::numeric AS net,
        COUNT(*)::int AS count
       FROM orders WHERE status != 'CANCELLED'`
    );
    const gmvRow = gmvResult.rows[0];
    const gmv = Number(gmvRow?.gmv ?? 0);
    const netRevenue = Number(gmvRow?.net ?? 0);
    const totalOrders = Number(gmvRow?.count ?? 0);

    const thisMonth = await this.db.query<{ gmv: string; net: string }>(
      `SELECT
        COALESCE(SUM(total_amount), 0)::numeric AS gmv,
        COALESCE(SUM(commission_amount), 0)::numeric AS net
       FROM orders WHERE status != 'CANCELLED' AND created_at >= $1`,
      [thisMonthStart.toISOString()]
    );
    const lastMonth = await this.db.query<{ gmv: string }>(
      `SELECT COALESCE(SUM(total_amount), 0)::numeric AS gmv
       FROM orders WHERE status != 'CANCELLED' AND created_at >= $1 AND created_at <= $2`,
      [lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
    );
    const thisMonthGmv = Number(thisMonth.rows[0]?.gmv ?? 0);
    const lastMonthGmv = Number(lastMonth.rows[0]?.gmv ?? 0);
    const momGrowth = lastMonthGmv > 0
      ? ((thisMonthGmv - lastMonthGmv) / lastMonthGmv) * 100
      : (thisMonthGmv > 0 ? 100 : 0);

    const mrrResult = await this.db.query<{ mrr: string }>(
      `SELECT COALESCE(SUM(
        CASE WHEN subscription_plan = 'yearly' THEN 5000.0 ELSE 5000.0 END
      ), 0)::numeric AS mrr
       FROM vendors WHERE subscription_status = 'active'`
    );
    const mrr = Number(mrrResult.rows[0]?.mrr ?? 0);
    const aov = totalOrders > 0 ? gmv / totalOrders : 0;

    // ---- B. Customer ----
    const customersResult = await this.db.query<{ total: string; new_this_month: string }>(
      `SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE created_at >= $1)::int AS new_this_month
       FROM users WHERE role = 'customer'`,
      [thisMonthStart.toISOString()]
    );
    const totalCustomers = Number(customersResult.rows[0]?.total ?? 0);
    const newCustomersMonthly = Number(customersResult.rows[0]?.new_this_month ?? 0);

    const returningResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM (
        SELECT customer_id FROM orders WHERE status != 'CANCELLED'
        GROUP BY customer_id HAVING COUNT(*) > 1
      ) t`
    );
    const returningCustomers = Number(returningResult.rows[0]?.count ?? 0);

    const everOrderedResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT customer_id)::int AS count FROM orders WHERE status != 'CANCELLED'`
    );
    const everOrdered = Number(everOrderedResult.rows[0]?.count ?? 0);
    const retentionResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(DISTINCT customer_id)::int AS count FROM orders
       WHERE status != 'CANCELLED' AND created_at >= NOW() - INTERVAL '30 days'`
    );
    const activeLast30 = Number(retentionResult.rows[0]?.count ?? 0);
    const retentionRate = everOrdered > 0 ? (activeLast30 / everOrdered) * 100 : 0;

    const avgOrdersPerCustomer = everOrdered > 0 ? totalOrders / everOrdered : 0;
    const grossMargin = 0.2;
    const ltv = aov * avgOrdersPerCustomer * grossMargin;
    const cac = 0; // Not tracked in DB
    const ltvCacRatio = cac > 0 ? ltv / cac : null;

    // ---- C. Vendor ----
    const vendorCounts = await this.db.query<{ total: string; active: string }>(
      `SELECT
        (SELECT COUNT(*)::int FROM vendors) AS total,
        (SELECT COUNT(DISTINCT vendor_id)::int FROM orders WHERE status != 'CANCELLED' AND created_at >= NOW() - INTERVAL '90 days') AS active`
    );
    const totalVendors = Number(vendorCounts.rows[0]?.total ?? 0);
    const activeVendors = Number(vendorCounts.rows[0]?.active ?? 0);
    const vendorRetentionRate = totalVendors > 0 ? (activeVendors / totalVendors) * 100 : 0;

    const cancellationResult = await this.db.query<{ total: string; cancelled: string }>(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled FROM orders`
    );
    const orderTotal = Number(cancellationResult.rows[0]?.total ?? 0);
    const cancelledOrders = Number(cancellationResult.rows[0]?.cancelled ?? 0);
    const cancellationRate = orderTotal > 0 ? (cancelledOrders / orderTotal) * 100 : 0;

    const vendorRevenueDist = await this.db.query<{ vendor_id: string; gmv: string; name: string }>(
      `SELECT o.vendor_id, v.business_name AS name, COALESCE(SUM(o.total_amount), 0)::numeric AS gmv
       FROM orders o
       JOIN vendors v ON v.id = o.vendor_id
       WHERE o.status != 'CANCELLED'
       GROUP BY o.vendor_id, v.business_name ORDER BY gmv DESC LIMIT 20`
    );

    // ---- D. Operational ----
    const statusCounts = await this.db.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::int AS count FROM orders GROUP BY status`
    );
    const statusMap: Record<string, number> = {};
    for (const r of statusCounts.rows) statusMap[r.status] = Number(r.count);
    const delivered = statusMap['DELIVERED'] ?? 0;
    const completed = delivered;
    const orderCompletionRate = orderTotal > 0 ? (completed / (orderTotal - cancelledOrders)) * 100 : 0;

    const paymentStats = await this.db.query<{ total: string; failed: string }>(
      `SELECT COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE LOWER(status) IN ('failed','error'))::int AS failed FROM payments`
    );
    const paymentTotal = Number(paymentStats.rows[0]?.total ?? 0);
    const failedPayments = Number(paymentStats.rows[0]?.failed ?? 0);
    const failedPaymentRate = paymentTotal > 0 ? (failedPayments / paymentTotal) * 100 : 0;

    const refundRate = 0; // No refunds table
    const deliverySla = null; // No delivered_at
    const supportTicketVolume = 0; // No support table

    // ---- E. Growth & Marketing (placeholders) ----
    const conversionResult = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM users WHERE role = 'customer'`
    );
    const visitors = totalCustomers * 10; // Placeholder
    const conversionRate = visitors > 0 ? (totalCustomers / visitors) * 100 : 0;

    return {
      revenue: {
        gmv,
        netRevenue,
        mrr,
        aov,
        momGrowthPercent: Math.round(momGrowth * 100) / 100,
        totalOrders,
        targetMomGrowth: '10-20%',
      },
      customer: {
        totalCustomers,
        newCustomersMonthly,
        returningCustomers,
        retentionRatePercent: Math.round(retentionRate * 100) / 100,
        cac,
        ltv: Math.round(ltv * 100) / 100,
        ltvCacRatio: ltvCacRatio != null ? Math.round(ltvCacRatio * 100) / 100 : null,
        targetLtvCac: 'LTV ≥ 3× CAC',
      },
      vendor: {
        activeVendors,
        totalVendors,
        vendorRetentionRatePercent: Math.round(vendorRetentionRate * 100) / 100,
        vendorRevenueDistribution: vendorRevenueDist.rows.map((r) => ({
          vendorId: r.vendor_id,
          name: r.name,
          gmv: Number(r.gmv),
        })),
        avgFulfillmentTimeHours: null,
        cancellationRatePercent: Math.round(cancellationRate * 100) / 100,
        vendorQualityScore: null,
      },
      operational: {
        orderCompletionRatePercent: Math.round(orderCompletionRate * 100) / 100,
        failedPaymentRatePercent: Math.round(failedPaymentRate * 100) / 100,
        refundRatePercent: refundRate,
        deliverySlaHours: deliverySla,
        supportTicketVolume,
      },
      growth: {
        trafficOrganic: null,
        trafficPaid: null,
        conversionRatePercent: Math.round(conversionRate * 100) / 100,
        targetConversionRate: '3-5%',
        costPerClick: null,
        costPerAcquisition: null,
        referralRatePercent: null,
      },
    };
  }

  /** Time-series for charts: daily, weekly, monthly */
  async getCharts(params: { period: 'daily' | 'weekly' | 'monthly' }) {
    const { period } = params;
    let groupBy: string;
    let since: string;
    if (period === 'daily') {
      groupBy = "date_trunc('day', created_at)";
      since = '30 days';
    } else if (period === 'weekly') {
      groupBy = "date_trunc('week', created_at)";
      since = '12 weeks';
    } else {
      groupBy = "date_trunc('month', created_at)";
      since = '12 months';
    }

    const result = await this.db.query<{ period: string; gmv: string; orders: string; net: string }>(
      `SELECT ${groupBy} AS period,
        COALESCE(SUM(total_amount), 0)::numeric AS gmv,
        COUNT(*)::int AS orders,
        COALESCE(SUM(commission_amount), 0)::numeric AS net
       FROM orders
       WHERE status != 'CANCELLED' AND created_at >= NOW() - $1::interval
       GROUP BY period ORDER BY period ASC`,
      [since]
    );

    return {
      period,
      data: result.rows.map((r) => ({
        period: r.period,
        gmv: Number(r.gmv),
        orders: Number(r.orders),
        netRevenue: Number(r.net),
      })),
    };
  }

  /** Simple linear predictive trend (next 3 periods) */
  async getRevenueTrend() {
    const hist = await this.db.query<{ gmv: string; period: string }>(
      `SELECT date_trunc('month', created_at) AS period, COALESCE(SUM(total_amount), 0)::numeric AS gmv
       FROM orders WHERE status != 'CANCELLED' AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY period ORDER BY period ASC`
    );
    const points = hist.rows.map((r) => ({ t: new Date(r.period).getTime(), y: Number(r.gmv) }));
    if (points.length < 2) {
      return { historical: points.map((p) => ({ period: new Date(p.t).toISOString(), gmv: p.y })), predicted: [] };
    }
    const n = points.length;
    let sumT = 0, sumY = 0, sumTY = 0, sumT2 = 0;
    for (const p of points) {
      sumT += p.t;
      sumY += p.y;
      sumTY += p.t * p.y;
      sumT2 += p.t * p.t;
    }
    const slope = (n * sumTY - sumT * sumY) / (n * sumT2 - sumT * sumT);
    const intercept = (sumY - slope * sumT) / n;
    const lastT = points[points.length - 1].t;
    const monthMs = 30 * 24 * 60 * 60 * 1000;
    const predicted = [];
    for (let i = 1; i <= 3; i++) {
      const t = lastT + i * monthMs;
      predicted.push({ period: new Date(t).toISOString(), predictedGmv: Math.max(0, intercept + slope * t) });
    }
    return {
      historical: points.map((p) => ({ period: new Date(p.t).toISOString(), gmv: p.y })),
      predicted,
    };
  }

  /** Vendor performance heatmap: vendor x metric (e.g. orders, gmv) */
  async getVendorsHeatmap() {
    const result = await this.db.query<{
      vendor_id: string;
      business_name: string;
      orders: string;
      gmv: string;
      cancelled: string;
    }>(
      `SELECT o.vendor_id, v.business_name,
        COUNT(*)::int AS orders,
        COALESCE(SUM(o.total_amount), 0)::numeric AS gmv,
        COUNT(*) FILTER (WHERE o.status = 'CANCELLED')::int AS cancelled
       FROM orders o
       JOIN vendors v ON v.id = o.vendor_id
       GROUP BY o.vendor_id, v.business_name
       ORDER BY gmv DESC`
    );
    const maxGmv = Math.max(...result.rows.map((r) => Number(r.gmv)), 1);
    return {
      vendors: result.rows.map((r) => ({
        vendorId: r.vendor_id,
        name: r.business_name,
        orders: Number(r.orders),
        gmv: Number(r.gmv),
        cancelled: Number(r.cancelled),
        score: maxGmv > 0 ? Math.round((Number(r.gmv) / maxGmv) * 100) : 0,
      })),
    };
  }

  /** City-level analytics (derive from delivery_address if possible) */
  async getCityAnalytics() {
    const result = await this.db.query<{ delivery_address: string | null; total: string; gmv: string }>(
      `SELECT delivery_address, COUNT(*)::int AS total, COALESCE(SUM(total_amount), 0)::numeric AS gmv
       FROM orders WHERE status != 'CANCELLED' AND delivery_address IS NOT NULL
       GROUP BY delivery_address`
    );
    const byCity: Record<string, { orders: number; gmv: number }> = {};
    for (const r of result.rows) {
      const addr = (r.delivery_address || '').trim();
      const city = addr.split(/[,]/)[0]?.trim() || 'Unknown';
      if (!byCity[city]) byCity[city] = { orders: 0, gmv: 0 };
      byCity[city].orders += Number(r.total);
      byCity[city].gmv += Number(r.gmv);
    }
    return {
      cities: Object.entries(byCity).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.gmv - a.gmv),
    };
  }

  /** Cohort retention: first order month -> % who ordered again in next month */
  async getCohortRetention() {
    const cohorts = await this.db.query<{ first_month: string; customer_id: string }>(
      `SELECT date_trunc('month', MIN(created_at)) AS first_month, customer_id
       FROM orders WHERE status != 'CANCELLED'
       GROUP BY customer_id`
    );
    const orderMonths = await this.db.query<{ customer_id: string; month: string }>(
      `SELECT customer_id, date_trunc('month', created_at) AS month
       FROM orders WHERE status != 'CANCELLED'`
    );
    const customerMonths = new Map<string, Set<string>>();
    for (const r of orderMonths.rows) {
      const key = r.customer_id;
      if (!customerMonths.has(key)) customerMonths.set(key, new Set());
      customerMonths.get(key)!.add(r.month);
    }
    const cohortMap = new Map<string, { size: number; retainedNext: number }>();
    const toMonthStr = (d: string) => new Date(d).toISOString().slice(0, 7);
    for (const c of cohorts.rows) {
      const first = c.first_month;
      const nextMonth = new Date(first);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextStr = toMonthStr(nextMonth.toISOString());
      const months = customerMonths.get(c.customer_id);
      const monthStrs = months ? [...months].map((m) => toMonthStr(m)) : [];
      const retained = monthStrs.includes(nextStr);
      if (!cohortMap.has(first)) cohortMap.set(first, { size: 0, retainedNext: 0 });
      const rec = cohortMap.get(first)!;
      rec.size += 1;
      if (retained) rec.retainedNext += 1;
    }
    return {
      cohorts: [...cohortMap.entries()].map(([month, data]) => ({
        cohortMonth: month,
        customers: data.size,
        retainedNextMonth: data.retainedNext,
        retentionPercent: data.size > 0 ? Math.round((data.retainedNext / data.size) * 10000) / 100 : 0,
      })).sort((a, b) => a.cohortMonth.localeCompare(b.cohortMonth)),
    };
  }
}
