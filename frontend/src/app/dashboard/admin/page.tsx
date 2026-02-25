"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Metrics = {
  revenue: {
    gmv: number;
    netRevenue: number;
    mrr: number;
    aov: number;
    momGrowthPercent: number;
    totalOrders: number;
    targetMomGrowth: string;
  };
  customer: {
    totalCustomers: number;
    newCustomersMonthly: number;
    returningCustomers: number;
    retentionRatePercent: number;
    cac: number;
    ltv: number;
    ltvCacRatio: number | null;
    targetLtvCac: string;
  };
  vendor: {
    activeVendors: number;
    totalVendors: number;
    vendorRetentionRatePercent: number;
    vendorRevenueDistribution: { vendorId: string; name: string; gmv: number }[];
    avgFulfillmentTimeHours: number | null;
    cancellationRatePercent: number;
    vendorQualityScore: number | null;
  };
  operational: {
    orderCompletionRatePercent: number;
    failedPaymentRatePercent: number;
    refundRatePercent: number;
    deliverySlaHours: number | null;
    supportTicketVolume: number;
  };
  growth: {
    trafficOrganic: number | null;
    trafficPaid: number | null;
    conversionRatePercent: number;
    targetConversionRate: string;
    costPerClick: number | null;
    costPerAcquisition: number | null;
    referralRatePercent: number | null;
  };
};

type ChartPoint = { period: string; gmv: number; orders: number; netRevenue: number };
type TrendPoint = { period: string; gmv?: number; predictedGmv?: number };
type HeatmapVendor = { vendorId: string; name: string; orders: number; gmv: number; cancelled: number; score: number };
type CityRow = { name: string; orders: number; gmv: number };
type CohortRow = { cohortMonth: string; customers: number; retainedNextMonth: number; retentionPercent: number };

const fmt = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toFixed(0);
const fmtMoney = (n: number) =>
  `₦${n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toFixed(0)}`;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [chartsDaily, setChartsDaily] = useState<ChartPoint[]>([]);
  const [chartsMonthly, setChartsMonthly] = useState<ChartPoint[]>([]);
  const [trend, setTrend] = useState<{ historical: TrendPoint[]; predicted: TrendPoint[] } | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapVendor[]>([]);
  const [cities, setCities] = useState<CityRow[]>([]);
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [chartPeriod, setChartPeriod] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    if (!cookie) {
      router.push("/auth/login");
      return;
    }

    async function run() {
      try {
        const opts = { credentials: "include" as RequestCredentials };
        const meRes = await fetch(`${API_BASE}/auth/me`, opts);
        if (!meRes.ok) {
          router.push("/auth/login");
          return;
        }
        const me = (await meRes.json()) as { role?: string };
        if (me.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        const [mRes, cDailyRes, cMonthRes, tRes, hRes, cityRes, cohortRes] = await Promise.all([
          fetch(`${API_BASE}/admin/metrics`, opts),
          fetch(`${API_BASE}/admin/charts?period=daily`, opts),
          fetch(`${API_BASE}/admin/charts?period=monthly`, opts),
          fetch(`${API_BASE}/admin/revenue-trend`, opts),
          fetch(`${API_BASE}/admin/vendors-heatmap`, opts),
          fetch(`${API_BASE}/admin/cities`, opts),
          fetch(`${API_BASE}/admin/cohorts`, opts),
        ]);

        if (!mRes.ok) {
          setError("Failed to load metrics");
          return;
        }

        if (!cancelled) {
          const m = (await mRes.json()) as Metrics;
          setMetrics(m);
          const cDaily = (await cDailyRes.json()) as { data: ChartPoint[] };
          const cMonth = (await cMonthRes.json()) as { data: ChartPoint[] };
          setChartsDaily((cDaily.data || []).map((d) => ({ ...d, period: d.period?.slice(0, 10) ?? d.period })));
          setChartsMonthly((cMonth.data || []).map((d) => ({ ...d, period: d.period?.slice(0, 7) ?? d.period })));
          const t = (await tRes.json()) as { historical: TrendPoint[]; predicted: TrendPoint[] };
          setTrend(t || null);
          const h = (await hRes.json()) as { vendors: HeatmapVendor[] };
          setHeatmap(h.vendors || []);
          const city = (await cityRes.json()) as { cities: CityRow[] };
          setCities(city.cities || []);
          const cohort = (await cohortRes.json()) as { cohorts: CohortRow[] };
          setCohorts(cohort.cohorts || []);
        }
      } catch {
        if (!cancelled) setError("Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-8">
        <div className="max-w-7xl mx-auto text-center py-20 text-zinc-500">Loading Founder Dashboard…</div>
      </main>
    );
  }

  if (error || !metrics) {
    return (
      <main className="min-h-screen bg-zinc-100 px-4 py-8">
        <div className="max-w-7xl mx-auto text-center py-20 text-red-600">{error ?? "No data"}</div>
      </main>
    );
  }

  const r = metrics.revenue;
  const c = metrics.customer;
  const v = metrics.vendor;
  const o = metrics.operational;
  const g = metrics.growth;
  const chartData = chartPeriod === "monthly" ? chartsMonthly : chartsDaily;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Founder Admin Dashboard</h1>
            <p className="text-sm text-zinc-600">Operate like a real CEO — exact metrics at a glance.</p>
          </div>
          <a href="/dashboard" className="text-sm text-zinc-600 hover:underline">← Back to Dashboard</a>
        </header>

        {/* A. Revenue */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> A. Revenue Dashboard
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <MetricCard label="GMV" value={fmtMoney(r.gmv)} />
            <MetricCard label="Net Revenue" value={fmtMoney(r.netRevenue)} />
            <MetricCard label="MRR" value={fmtMoney(r.mrr)} />
            <MetricCard label="AOV" value={fmtMoney(r.aov)} />
            <MetricCard label="MoM Growth" value={`${r.momGrowthPercent}%`} sub={r.targetMomGrowth} />
            <MetricCard label="Total Orders" value={String(r.totalOrders)} />
          </div>
        </section>

        {/* B. Customer */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" /> B. Customer Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <MetricCard label="Total Customers" value={fmt(c.totalCustomers)} />
            <MetricCard label="New (Monthly)" value={fmt(c.newCustomersMonthly)} />
            <MetricCard label="Returning" value={fmt(c.returningCustomers)} />
            <MetricCard label="Retention Rate" value={`${c.retentionRatePercent}%`} />
            <MetricCard label="CAC" value={c.cac === 0 ? "N/A" : fmtMoney(c.cac)} />
            <MetricCard label="LTV" value={fmtMoney(c.ltv)} sub={c.ltvCacRatio != null ? `LTV/CAC: ${c.ltvCacRatio}x` : c.targetLtvCac} />
          </div>
        </section>

        {/* C. Vendor */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" /> C. Vendor Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <MetricCard label="Active Vendors" value={String(v.activeVendors)} />
            <MetricCard label="Total Vendors" value={String(v.totalVendors)} />
            <MetricCard label="Vendor Retention" value={`${v.vendorRetentionRatePercent}%`} />
            <MetricCard label="Avg Fulfillment" value={v.avgFulfillmentTimeHours != null ? `${v.avgFulfillmentTimeHours}h` : "N/A"} />
            <MetricCard label="Cancellation Rate" value={`${v.cancellationRatePercent}%`} />
            <MetricCard label="Quality Score" value={v.vendorQualityScore != null ? String(v.vendorQualityScore) : "N/A"} />
          </div>
        </section>

        {/* D. Operational */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" /> D. Operational Metrics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard label="Order Completion" value={`${o.orderCompletionRatePercent}%`} />
            <MetricCard label="Failed Payment Rate" value={`${o.failedPaymentRatePercent}%`} />
            <MetricCard label="Refund Rate" value={`${o.refundRatePercent}%`} />
            <MetricCard label="Delivery SLA" value={o.deliverySlaHours != null ? `${o.deliverySlaHours}h` : "N/A"} />
            <MetricCard label="Support Tickets" value={String(o.supportTicketVolume)} />
          </div>
        </section>

        {/* E. Growth & Marketing */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500" /> E. Growth & Marketing
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard label="Traffic (Organic)" value={g.trafficOrganic != null ? fmt(g.trafficOrganic) : "N/A"} />
            <MetricCard label="Traffic (Paid)" value={g.trafficPaid != null ? fmt(g.trafficPaid) : "N/A"} />
            <MetricCard label="Conversion Rate" value={`${g.conversionRatePercent}%`} sub={g.targetConversionRate} />
            <MetricCard label="CPC" value={g.costPerClick != null ? fmtMoney(g.costPerClick) : "N/A"} />
            <MetricCard label="CPA" value={g.costPerAcquisition != null ? fmtMoney(g.costPerAcquisition) : "N/A"} />
            <MetricCard label="Referral Rate" value={g.referralRatePercent != null ? `${g.referralRatePercent}%` : "N/A"} />
          </div>
        </section>

        {/* Charts: daily / weekly / monthly */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">Revenue & Orders (Charts)</h2>
          <div className="flex gap-2 mb-4">
            {(["daily", "monthly"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm ${chartPeriod === p ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-700"}`}
              >
                {p === "daily" ? "Daily" : "Monthly"}
              </button>
            ))}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                <Tooltip formatter={(v: number) => [typeof v === "number" ? fmt(v) : v, ""]} labelFormatter={(l) => l} />
                <Bar yAxisId="left" dataKey="gmv" name="GMV" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="orders" name="Orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Predictive revenue trend */}
        {trend && (trend.historical?.length > 0 || trend.predicted?.length > 0) && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-800 mb-4">Predictive Revenue Trend</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    ...(trend.historical || []).map((h) => ({ ...h, period: h.period?.slice(0, 7) ?? h.period })),
                    ...(trend.predicted || []).map((p) => ({ ...p, period: p.period?.slice(0, 7) ?? p.period, gmv: undefined, predictedGmv: p.predictedGmv })),
                  ]}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip formatter={(v: number) => [v != null ? fmt(v) : "", ""]} />
                  <Legend />
                  <Line type="monotone" dataKey="gmv" name="Actual GMV" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="predictedGmv" name="Predicted GMV" stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Vendor performance heatmap */}
        {heatmap.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-800 mb-4">Vendor Performance Heatmap</h2>
            <div className="overflow-x-auto">
              <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
                {heatmap.map((vendor) => (
                  <div
                    key={vendor.vendorId}
                    className="rounded-lg p-3 border border-zinc-200 text-center"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${vendor.score / 100})`,
                      color: vendor.score > 50 ? "white" : "inherit",
                    }}
                    title={`${vendor.name}: ${vendor.orders} orders, ${fmtMoney(vendor.gmv)}`}
                  >
                    <div className="font-medium truncate text-sm">{vendor.name}</div>
                    <div className="text-xs opacity-90">{vendor.orders} orders · {fmtMoney(vendor.gmv)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* City-level analytics */}
        {cities.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-800 mb-4">City-Level Analytics</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cities} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis type="number" tickFormatter={(v) => fmt(v)} />
                  <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [typeof v === "number" ? fmt(v) : v, ""]} />
                  <Bar dataKey="gmv" name="GMV" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="orders" name="Orders" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Cohort retention */}
        {cohorts.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-800 mb-4">Cohort Retention (Next-Month Retention %)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cohorts.map((x) => ({ ...x, cohortMonth: x.cohortMonth.slice(0, 7) }))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="cohortMonth" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v: number, name: string) => [name === "retentionPercent" ? `${v}%` : v, name === "retentionPercent" ? "Retention" : name]} />
                  <Bar dataKey="retentionPercent" name="Retention %" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
      <div className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold text-zinc-900 mt-0.5">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}
