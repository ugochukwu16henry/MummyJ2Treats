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
  created_at: string;
};

export default function VendorDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`${API_BASE}/orders/me`, { credentials: "include" });
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        const data = (await res.json()) as { data?: Order[] };
        if (!cancelled) setOrders(data.data ?? []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [router]);

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
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:underline">← Back</Link>
        </header>
        <p className="text-sm text-zinc-600">
          Your orders are listed below. Use the API (PATCH /vendors/me/branding, /vendors/me/payout) to manage profile and payout.
        </p>
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Your Orders</h2>
          {orders.length === 0 ? (
            <p className="text-zinc-500 text-sm">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <span className="font-mono text-sm">{o.order_number}</span>
                  <span className="text-sm text-zinc-600">{o.status}</span>
                  <span className="font-medium">₦{Number(o.total_amount).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
