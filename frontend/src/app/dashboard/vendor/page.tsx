"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

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

export default function VendorDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorState, setVendorState] = useState<string | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      const profile = (await profileRes.json()) as { operating_state?: string };
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

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-20 text-zinc-500">Loading vendor dashboard…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
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
        <p className="text-sm text-zinc-600">
          <Link href="/dashboard/vendor/location" className="text-primary font-medium hover:underline">Location & delivery</Link>
          {" · "}
          Your orders are below. Set your operating state in Location & delivery to see riders and assign them.
        </p>
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
