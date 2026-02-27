"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Order = { id: string; order_number: string; status: string; total_amount: number; created_at: string };

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/orders`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((data: { data?: Order[] }) => setOrders(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Orders</h1>
        <p className="text-sm text-zinc-600 mt-0.5">View and manage orders across vendors.</p>
      </div>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          No orders yet. Orders will appear here when customers place them.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {orders.map((o) => (
              <li
                key={o.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
              >
                <span className="font-mono text-sm text-zinc-700">{o.order_number}</span>
                <span className="text-zinc-600 text-sm">
                  ₦{Number(o.total_amount).toLocaleString()} · {o.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
