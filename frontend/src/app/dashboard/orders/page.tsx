"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type OrderItem = { productName: string; quantity: number; unitPrice: number };
type Order = {
  id: string;
  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  items: OrderItem[];
};

const statusColor: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-blue-800",
  PREPARING: "bg-indigo-100 text-indigo-800",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-zinc-100 text-zinc-600",
};

export default function OrdersPage() {
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
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        if (!cancelled) setOrders(list as Order[]);
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
      <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        <SiteHeader />
        <main className="flex-1 px-4 sm:px-6 py-8">
          <div className="max-w-3xl mx-auto text-center py-20" style={{ color: "var(--foreground)" }}>Loading your orders…</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <SiteHeader />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Order history</h1>
            <Link href="/dashboard" className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>← Dashboard</Link>
          </header>
          {orders.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-8 text-center" style={{ background: "var(--background)", color: "var(--foreground)" }}>
              <p>You haven’t placed any orders yet.</p>
              <Link href="/categories" className="inline-block mt-4 font-medium hover:underline" style={{ color: "var(--primary)" }}>Browse and order →</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/dashboard/orders/${o.id}`}
                    className="block rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-zinc-200 dark:border-zinc-800"
                    style={{ background: "var(--background)" }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-sm opacity-70" style={{ color: "var(--foreground)" }}>#{o.id.slice(0, 8)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[o.status] ?? "bg-zinc-100 text-zinc-700"}`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="text-sm mt-1 opacity-90" style={{ color: "var(--foreground)" }}>
                      {o.items?.length ?? 0} item(s) · ₦{Number(o.total).toLocaleString()}
                    </p>
                    <p className="text-xs opacity-70 mt-0.5" style={{ color: "var(--foreground)" }}>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </p>
                    <div className="mt-2 flex gap-2 text-xs font-medium">
                      <span style={{ color: "var(--primary)" }}>View</span>
                      <span style={{ color: "var(--primary)" }}>Track</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
