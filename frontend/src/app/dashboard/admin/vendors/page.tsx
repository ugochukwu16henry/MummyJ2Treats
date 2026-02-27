"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Vendor = {
  id: string;
  business_name: string;
  slug: string;
  is_verified: boolean;
  subscription_status?: string;
  signup_fee_paid?: boolean;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vendors`, { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as { data?: Vendor[] };
      setVendors(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approveVendor(id: string) {
    try {
      setSavingId(id);
      await fetch(`${API_BASE}/vendors/${id}/approve`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isVerified: true,
          signupFeePaid: true,
        }),
      });
      await load();
    } finally {
      setSavingId(null);
    }
  }

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
              <li key={v.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-zinc-900">{v.business_name}</div>
                  <div className="text-xs text-zinc-500">
                    {v.slug} · {v.subscription_status ?? "no-plan"}
                    {v.signup_fee_paid ? " · signup fee paid" : " · signup fee unpaid"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      v.is_verified ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"
                    }`}
                  >
                    {v.is_verified ? "Verified" : "Pending"}
                  </span>
                  {!v.is_verified && (
                    <button
                      type="button"
                      onClick={() => approveVendor(v.id)}
                      disabled={savingId === v.id}
                      className="text-xs px-3 py-1 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {savingId === v.id ? "Approving…" : "Approve & activate"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
