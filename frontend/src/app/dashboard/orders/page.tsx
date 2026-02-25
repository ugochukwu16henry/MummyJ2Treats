"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Order = {
  id: string;
  order_number: string;
  vendor_id: string;
  vendor_name: string | null;
  vendor_slug: string | null;
  status: string;
  total_amount: number;
  payment_status: string;
  delivery_address: string | null;
  created_at: string;
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
        <div className="max-w-3xl mx-auto text-center py-20 text-zinc-500">Loading your orders…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My orders</h1>
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:underline">← Dashboard</Link>
        </header>
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-600">
            <p>You haven’t placed any orders yet.</p>
            <Link href="/" className="inline-block mt-4 text-primary font-medium hover:underline">Browse and order →</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/orders/${o.id}`}
                  className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow border border-zinc-100"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm text-zinc-500">{o.order_number}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[o.status] ?? "bg-zinc-100 text-zinc-700"}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="font-medium mt-1">{o.vendor_name ?? "Vendor"}</p>
                  <p className="text-zinc-600 text-sm mt-0.5">
                    ₦{Number(o.total_amount).toLocaleString()} · {new Date(o.created_at).toLocaleDateString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
