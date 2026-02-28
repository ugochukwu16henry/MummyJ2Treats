import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { v4 as uuidv4 } from 'uuid';

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

    // CAC from platform_metrics (current month)
    const platformRow = await this.getPlatformMetricsForMonth(thisMonthStart);
    const cac = platformRow?.cac != null ? Number(platformRow.cac) : 0;
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

    // Delivery SLA: avg hours from order created to delivered_at (when set)
    const slaResult = await this.db.query<{ avg_hours: string }>(
      `SELECT EXTRACT(EPOCH FROM AVG(delivered_at - created_at)) / 3600 AS avg_hours
       FROM orders WHERE status = 'DELIVERED' AND delivered_at IS NOT NULL`
    );
    const deliverySla = slaResult.rows[0]?.avg_hours != null ? Math.round(Number(slaResult.rows[0].avg_hours) * 100) / 100 : null;

    // Support ticket volume (this month)
    const ticketResult = await this.db.query<{ count: string }>(
      `SELECT COUNT(*)::int AS count FROM support_tickets WHERE created_at >= $1`,
      [thisMonthStart.toISOString()]
    );
    const supportTicketVolume = Number(ticketResult.rows[0]?.count ?? 0);

    // ---- E. Growth & Marketing (from platform_metrics when present) ----
    const trafficOrganic = platformRow?.traffic_organic != null ? Number(platformRow.traffic_organic) : null;
    const trafficPaid = platformRow?.traffic_paid != null ? Number(platformRow.traffic_paid) : null;
    const visitors = (trafficOrganic ?? 0) + (trafficPaid ?? 0) || totalCustomers * 10;
    const conversionResult = await this.db.query<{ total: string }>(
      `SELECT COUNT(*)::int AS total FROM users WHERE role = 'customer'`
    );
    const conversionRate = visitors > 0 ? (totalCustomers / visitors) * 100 : 0;
    const costPerClick = platformRow?.cpc != null ? Number(platformRow.cpc) : null;
    const costPerAcquisition = platformRow?.cpa != null ? Number(platformRow.cpa) : null;
    const referralCount = platformRow?.referral_count != null ? Number(platformRow.referral_count) : 0;
    const referralRatePercent = visitors > 0 ? (referralCount / visitors) * 100 : null;

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
        vendorRevenueDistribution: vendorRevenueDist.rows.map((r: { vendor_id: string; name: string; gmv: string }) => ({
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
        trafficOrganic: trafficOrganic,
        trafficPaid: trafficPaid,
        conversionRatePercent: Math.round(conversionRate * 100) / 100,
        targetConversionRate: '3-5%',
        costPerClick: costPerClick,
        costPerAcquisition: costPerAcquisition,
        referralRatePercent: referralRatePercent != null ? Math.round(referralRatePercent * 100) / 100 : null,
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
      data: result.rows.map((r: { period: string; gmv: string; orders: string; net: string }) => ({
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
    const points = hist.rows.map((r: { period: string; gmv: string }) => ({ t: new Date(r.period).getTime(), y: Number(r.gmv) }));
    if (points.length < 2) {
      return { historical: points.map((p: { t: number; y: number }) => ({ period: new Date(p.t).toISOString(), gmv: p.y })), predicted: [] };
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
      historical: points.map((p: { t: number; y: number }) => ({ period: new Date(p.t).toISOString(), gmv: p.y })),
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
    const maxGmv = Math.max(...result.rows.map((r: { gmv: string }) => Number(r.gmv)), 1);
    return {
      vendors: result.rows.map((r: { vendor_id: string; business_name: string; orders: string; gmv: string; cancelled: string }) => ({
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

  private async getPlatformMetricsForMonth(monthStart: Date): Promise<{
    traffic_organic?: string;
    traffic_paid?: string;
    cpc?: string;
    cpa?: string;
    cac?: string;
    referral_count?: string;
  } | null> {
    const periodDate = monthStart.toISOString().slice(0, 10);
    const r = await this.db.query(
      `SELECT traffic_organic, traffic_paid, cpc, cpa, cac, referral_count
       FROM platform_metrics WHERE period_type = 'month' AND period_date = $1 LIMIT 1`,
      [periodDate],
    );
    return r.rows[0] ?? null;
  }

  async createSupportTicket(dto: {
    subject: string;
    body?: string;
    orderId?: string;
    customerId?: string;
  }) {
    const id = uuidv4();
    await this.db.query(
      `INSERT INTO support_tickets (id, subject, body, order_id, customer_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, dto.subject, dto.body ?? null, dto.orderId ?? null, dto.customerId ?? null],
    );
    const r = await this.db.query('SELECT * FROM support_tickets WHERE id = $1', [id]);
    return r.rows[0];
  }

  async listSupportTickets(opts: { status?: 'open' | 'closed'; limit?: number }) {
    const limit = Math.min(opts.limit ?? 50, 200);
    let query = 'SELECT * FROM support_tickets';
    const params: any[] = [];
    if (opts.status) {
      params.push(opts.status);
      query += ` WHERE status = $${params.length}`;
    }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    const r = await this.db.query(query, params);
    return { data: r.rows };
  }

  async upsertPlatformMetrics(dto: {
    periodDate: string;
    periodType: 'day' | 'month';
    trafficOrganic?: number;
    trafficPaid?: number;
    cpc?: number;
    cpa?: number;
    cac?: number;
    referralCount?: number;
  }) {
    const id = uuidv4();
    await this.db.query(
      `INSERT INTO platform_metrics (
        id, period_date, period_type,
        traffic_organic, traffic_paid, cpc, cpa, cac, referral_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (period_date, period_type) DO UPDATE SET
        traffic_organic = COALESCE(NULLIF($4, 0), platform_metrics.traffic_organic),
        traffic_paid = COALESCE(NULLIF($5, 0), platform_metrics.traffic_paid),
        cpc = COALESCE($6, platform_metrics.cpc),
        cpa = COALESCE($7, platform_metrics.cpa),
        cac = COALESCE($8, platform_metrics.cac),
        referral_count = COALESCE(NULLIF($9, 0), platform_metrics.referral_count)`,
      [
        id,
        dto.periodDate,
        dto.periodType,
        dto.trafficOrganic ?? 0,
        dto.trafficPaid ?? 0,
        dto.cpc ?? null,
        dto.cpa ?? null,
        dto.cac ?? null,
        dto.referralCount ?? 0,
      ],
    );
    const r = await this.db.query(
      `SELECT * FROM platform_metrics WHERE period_date = $1 AND period_type = $2`,
      [dto.periodDate, dto.periodType],
    );
    return r.rows[0];
  }

  /** Founder Admin: delivery map data — vendors, order delivery locations, riders */
  async getDeliveryMapData() {
    const vendors = await this.db.query(
      `SELECT id, business_name, slug, operating_state, operating_city, vendor_latitude, vendor_longitude
       FROM vendors WHERE vendor_latitude IS NOT NULL AND vendor_longitude IS NOT NULL`
    );
    const orders = await this.db.query(
      `SELECT id, order_number, vendor_id, rider_id, status, latitude, longitude, delivery_state, delivery_city, created_at
       FROM orders WHERE status NOT IN ('CANCELLED') AND (latitude IS NOT NULL OR delivery_address IS NOT NULL)
       ORDER BY created_at DESC LIMIT 500`
    );
    const riders = await this.db.query(
      `SELECT r.id, r.state, r.current_latitude, r.current_longitude, r.location_updated_at, u.first_name, u.last_name
       FROM riders r JOIN users u ON u.id = r.user_id
       WHERE r.current_latitude IS NOT NULL AND r.current_longitude IS NOT NULL`
    );
    return {
      vendors: vendors.rows,
      orders: orders.rows,
      riders: riders.rows,
    };
  }

  async getPlatformMetrics(periodDate?: string, periodType?: 'day' | 'month') {
    if (periodDate && periodType) {
      const r = await this.db.query(
        `SELECT * FROM platform_metrics WHERE period_date = $1 AND period_type = $2`,
        [periodDate, periodType],
      );
      return r.rows[0] ?? null;
    }
    const r = await this.db.query(
      `SELECT * FROM platform_metrics ORDER BY period_date DESC, period_type LIMIT 60`,
    );
    return { data: r.rows };
  }

  /** Get founder admin profile picture URL (latest by uploaded_at). */
  async getAdminProfilePictureUrl(adminId: string): Promise<string | null> {
    const r = await this.db.query<{ url: string }>(
      `SELECT url FROM founder_admin_profile_pictures WHERE admin_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
      [adminId],
    );
    return r.rows[0]?.url ?? null;
  }

  /** Set founder admin profile picture (insert new row). */
  async setAdminProfilePicture(adminId: string, url: string): Promise<{ url: string }> {
    await this.db.query(
      `INSERT INTO founder_admin_profile_pictures (id, admin_id, url) VALUES ($1, $2, $3)`,
      [uuidv4(), adminId, url],
    );
    return { url };
  }

  private founderCategoriesInitialized = false;
  private async ensureFounderCategoriesTable() {
    if (this.founderCategoriesInitialized) return;
    this.founderCategoriesInitialized = true;
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS founder_categories (
        id UUID PRIMARY KEY,
        name VARCHAR NOT NULL,
        slug VARCHAR UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT now()
      )
    `);
  }

  async listFounderCategories() {
    await this.ensureFounderCategoriesTable();
    const r = await this.db.query(
      `SELECT id, name, slug, description, image_url, sort_order, created_at FROM founder_categories ORDER BY sort_order ASC, name ASC`,
    );
    return { data: r.rows };
  }

  async createFounderCategory(dto: { name: string; slug: string; description?: string; imageUrl?: string }) {
    await this.ensureFounderCategoriesTable();
    const id = uuidv4();
    await this.db.query(
      `INSERT INTO founder_categories (id, name, slug, description, image_url) VALUES ($1, $2, $3, $4, $5)`,
      [id, dto.name.trim(), dto.slug.trim().toLowerCase().replace(/\s+/g, '-'), dto.description?.trim() ?? null, dto.imageUrl ?? null],
    );
    const r = await this.db.query(`SELECT * FROM founder_categories WHERE id = $1`, [id]);
    return r.rows[0];
  }

  async updateFounderCategory(id: string, dto: { name?: string; slug?: string; description?: string; imageUrl?: string }) {
    await this.ensureFounderCategoriesTable();
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;
    if (dto.name !== undefined) {
      updates.push(`name = $${i++}`);
      values.push(dto.name.trim());
    }
    if (dto.slug !== undefined) {
      updates.push(`slug = $${i++}`);
      values.push(dto.slug.trim().toLowerCase().replace(/\s+/g, '-'));
    }
    if (dto.description !== undefined) {
      updates.push(`description = $${i++}`);
      values.push(dto.description.trim() || null);
    }
    if (dto.imageUrl !== undefined) {
      updates.push(`image_url = $${i++}`);
      values.push(dto.imageUrl);
    }
    if (updates.length === 0) {
      const r = await this.db.query(`SELECT * FROM founder_categories WHERE id = $1`, [id]);
      return r.rows[0] ?? null;
    }
    values.push(id);
    const r = await this.db.query(
      `UPDATE founder_categories SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      values,
    );
    return r.rows[0] ?? null;
  }

  async deleteFounderCategory(id: string): Promise<boolean> {
    await this.ensureFounderCategoriesTable();
    const r = await this.db.query(`DELETE FROM founder_categories WHERE id = $1 RETURNING id`, [id]);
    return (r.rowCount ?? 0) > 0;
  }
}
