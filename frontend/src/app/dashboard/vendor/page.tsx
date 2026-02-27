"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type VendorProfile = {
  business_name: string;
  description?: string;
  logo_url?: string;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string | null;
  rider_id?: string | null;
  created_at: string;
};

type Rider = { id: string; first_name: string; last_name: string; phone: string | null; transport_type: string | null; is_available: boolean };

type OnboardingStep = { key: string; completed: boolean; completedAt: string | null };
type Bonus = { id: string; period_date: string; amount: number; criteria: string; status: string; created_at: string };

export default function VendorDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorState, setVendorState] = useState<string | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [onboarding, setOnboarding] = useState<{ steps: OnboardingStep[]; complete: boolean } | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);

  async function loadOrders() {
    const res = await fetch(`${API_BASE}/orders/me`, { credentials: "include" });
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (res.status === 403) { router.push("/dashboard"); return; }
    const data = (await res.json()) as { data?: Order[] };
    setOrders(data.data ?? []);
  }

  async function loadProfileAndRiders() {
    const profileRes = await fetch(`${API_BASE}/vendors/me/profile`, { credentials: "include" });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      setVendorProfile({
        business_name: profile.business_name ?? "",
        description: profile.description ?? "",
        logo_url: profile.logo_url ?? undefined,
      });
      const state = profile.operating_state?.trim();
      setVendorState(state ?? null);
      if (state) {
        const ridersRes = await fetch(`${API_BASE}/riders/by-state?state=${encodeURIComponent(state)}&available=true`, { credentials: "include" });
        if (ridersRes.ok) {
          const r = (await ridersRes.json()) as { data?: Rider[] };
          setRiders(r.data ?? []);
        }
      }
    }
    // Onboarding steps
    try {
      const onboardingRes = await fetch(`${API_BASE}/moat/onboarding`, { credentials: "include" });
      if (onboardingRes.ok) {
        const data = await onboardingRes.json();
        setOnboarding(data);
      }
    } catch {}
    // Vendor bonuses
    try {
      const bonusRes = await fetch(`${API_BASE}/moat/vendor-bonuses`, { credentials: "include" });
      if (bonusRes.ok) {
        const data = await bonusRes.json();
        setBonuses(Array.isArray(data.data) ? data.data : []);
      }
    } catch {}
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        // Ensure this user has a vendor account and vendor tokens; backend upgrades customer → vendor here.
        await fetch(`${API_BASE}/auth/become-vendor`, {
          method: "POST",
          credentials: "include",
        }).catch(() => {});
        await Promise.all([loadOrders(), loadProfileAndRiders()]);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [router]);

  async function assignRider(orderId: string, riderId: string) {
    try {
      setAssigningOrderId(orderId);
      const res = await fetch(`${API_BASE}/riders/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ riderId }),
      });
      if (res.ok) await loadOrders();
    } finally {
      setAssigningOrderId(null);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    if (!status) return;
    try {
      setUpdatingStatusId(orderId);
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadOrders();
      }
    } finally {
      setUpdatingStatusId(null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-20 text-zinc-500">Loading vendor dashboard…</div>
      </main>
    );
  }

  // Basic analytics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === "DELIVERED").length;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Onboarding checklist */}
        {onboarding && onboarding.steps && onboarding.steps.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Onboarding Checklist</h2>
            <ul className="space-y-1">
              {onboarding.steps.map((step) => (
                <li key={step.key} className="flex items-center gap-2 text-sm">
                  <span className={`inline-block w-3 h-3 rounded-full ${step.completed ? "bg-green-500" : "bg-zinc-300"}`}></span>
                  <span className={step.completed ? "line-through text-zinc-400" : ""}>{step.key.replace(/_/g, " ")}</span>
                  {step.completed && step.completedAt && (
                    <span className="text-xs text-zinc-400 ml-2">({new Date(step.completedAt).toLocaleDateString()})</span>
                  )}
                </li>
              ))}
            </ul>
            {onboarding.complete && <div className="mt-2 text-green-700 text-sm font-medium">Onboarding complete!</div>}
          </section>
        )}

        {/* Vendor bonuses */}
        {bonuses && bonuses.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Performance Bonuses</h2>
            <ul className="space-y-2">
              {bonuses.map((b) => (
                <li key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  <div>
                    <span className="font-medium">₦{b.amount.toLocaleString()}</span> for <span className="font-mono">{b.period_date}</span>
                    {b.criteria && <span className="ml-2 text-xs text-zinc-500">({b.criteria})</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${b.status === "paid" ? "bg-green-100 text-green-700" : b.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-zinc-100 text-zinc-700"}`}>{b.status}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:underline">← Back</Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
                } catch {}
                document.cookie = "access_token=; path=/; max-age=0";
                router.push("/auth/login");
              }}
              className="px-3 py-1 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Vendor profile summary */}
        {vendorProfile && (
          <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {vendorProfile.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendorProfile.logo_url}
                alt="Logo"
                className="w-16 h-16 rounded-full object-cover border"
              />
            )}
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold mb-1">{vendorProfile.business_name}</h2>
              {vendorProfile.description && (
                <p className="text-zinc-600 text-sm mb-1">{vendorProfile.description}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 justify-center sm:justify-start">
                <Link
                  href="/dashboard/vendor/location"
                  className="text-primary font-medium hover:underline"
                >
                  Location &amp; delivery
                </Link>
                <Link
                  href="/dashboard/vendor/products"
                  className="text-primary font-medium hover:underline"
                >
                  Manage products
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Basic analytics */}
        <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
          <div>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-zinc-500">Total Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <div className="text-xs text-zinc-500">Orders Delivered</div>
          </div>
        </section>

        {/* Orders and rider assignment */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Your Orders</h2>
          {orders.length === 0 ? (
            <p className="text-zinc-500 text-sm">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-zinc-100 last:border-0">
                  <div>
                    <span className="font-mono text-sm">{o.order_number}</span>
                    <span className="mx-2 text-zinc-400">·</span>
                    <span className="text-sm text-zinc-600">{o.status}</span>
                    {o.rider_id && <span className="ml-2 text-xs text-green-600">Rider assigned</span>}
                  </div>
                  <span className="font-medium">₦{Number(o.total_amount).toLocaleString()}</span>
                  <select
                    className="text-xs border border-zinc-300 rounded px-2 py-1"
                    value={o.status}
                    disabled={updatingStatusId === o.id}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                  >
                    {["PENDING", "PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {!o.rider_id && vendorState && riders.length > 0 && ["PAID", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status) && (
                    <select
                      className="text-sm border border-zinc-300 rounded px-2 py-1"
                      disabled={assigningOrderId === o.id}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) assignRider(o.id, id);
                      }}
                    >
                      <option value="">Assign rider</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.first_name} {r.last_name} {r.transport_type ? `(${r.transport_type})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
