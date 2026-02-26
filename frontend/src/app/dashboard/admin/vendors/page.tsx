"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Vendor = { id: string; business_name: string; slug: string; is_verified: boolean };

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/vendors`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((data: { data?: Vendor[] }) => setVendors(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Vendors</h1>
        <p className="text-sm text-zinc-600 mt-0.5">Manage and approve vendors.</p>
      </div>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : vendors.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          No vendors yet. When vendors sign up and complete onboarding, they will appear here.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {vendors.map((v) => (
              <li key={v.id} className="p-4 flex items-center justify-between">
                <span className="font-medium text-zinc-900">{v.business_name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${v.is_verified ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"}`}>
                  {v.is_verified ? "Verified" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
