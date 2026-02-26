"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type DeliveryMap = {
  vendors?: { id: string; business_name: string; slug?: string }[];
  orders?: { id: string; order_number?: string; status: string }[];
  riders?: { id: string; first_name?: string; last_name?: string }[];
};

export default function AdminDeliveryMapPage() {
  const [data, setData] = useState<DeliveryMap | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/delivery-map`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Delivery map</h1>
        <p className="text-sm text-zinc-600 mt-0.5">Vendors, orders, and riders for delivery intelligence.</p>
      </div>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : !data ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          Could not load delivery map. Data will appear when vendors, orders, and riders exist.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-zinc-800 mb-2">Vendors</h2>
            {(data.vendors?.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">No data</p>
            ) : (
              <ul className="text-sm text-zinc-700 space-y-1">
                {data.vendors?.slice(0, 10).map((v) => (
                  <li key={v.id}>{v.business_name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-zinc-800 mb-2">Orders</h2>
            {(data.orders?.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">No data</p>
            ) : (
              <ul className="text-sm text-zinc-700 space-y-1">
                {data.orders?.slice(0, 10).map((o) => (
                  <li key={o.id}>{o.order_number ?? o.id} · {o.status}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-zinc-800 mb-2">Riders</h2>
            {(data.riders?.length ?? 0) === 0 ? (
              <p className="text-sm text-zinc-500">No data</p>
            ) : (
              <ul className="text-sm text-zinc-700 space-y-1">
                {data.riders?.slice(0, 10).map((r) => (
                  <li key={r.id}>{[r.first_name, r.last_name].filter(Boolean).join(" ") || r.id}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
