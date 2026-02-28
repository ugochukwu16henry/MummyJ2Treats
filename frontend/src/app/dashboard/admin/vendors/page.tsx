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
  commission_rate?: number | null;
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [commissionDrafts, setCommissionDrafts] = useState<Record<string, string>>({});
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null);
  const [details, setDetails] = useState<any | null>(null);
  const [detailsPic, setDetailsPic] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getAuthHeaders = (): HeadersInit => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    const token = cookie?.replace(/^access_token=/, "").trim();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const opts = () => ({ credentials: "include" as RequestCredentials, headers: getAuthHeaders() });

  async function loadDetails(id: string) {
    setDetails(null); setDetailsPic(null);
    try {
      const res = await fetch(`${API_BASE}/vendors/${id}/profile`, { credentials: "include" });
      if (res.ok) setDetails(await res.json());
      const picRes = await fetch(`${API_BASE}/vendors/${id}/profile-picture`, { credentials: "include" });
      if (picRes.ok) { const pic = await picRes.json(); setDetailsPic(pic.url ?? null); }
    } catch {}
  }

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

  async function saveCommission(id: string, raw: string | undefined) {
    if (!raw) return;
    const rate = Number(raw);
    if (Number.isNaN(rate) || rate < 0) return;
    try {
      setSavingId(id);
      await fetch(`${API_BASE}/vendors/${id}/approve`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate: rate }),
      });
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function deleteVendor(id: string) {
    if (!confirm("Permanently delete this vendor and their data? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/vendors/${id}`, { method: "DELETE", ...opts() });
      if (res.ok) await load();
    } finally {
      setDeletingId(null);
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
                  <div className="text-xs text-zinc-500 space-x-1">
                    <span>{v.slug}</span>
                    <span>· {v.subscription_status ?? "no-plan"}</span>
                    <span>{v.signup_fee_paid ? "· signup fee paid" : "· signup fee unpaid"}</span>
                    <span>· commission {v.commission_rate ?? 0}%</span>
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
                  <button
                    type="button"
                    className="text-xs px-2 py-1 rounded-md border border-primary text-primary hover:bg-primary/10"
                    onClick={() => { setShowDetailsId(v.id); loadDetails(v.id); }}
                  >View details</button>
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
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    className="w-20 text-xs border border-zinc-300 rounded px-1 py-0.5"
                    value={
                      commissionDrafts[v.id] ??
                      (v.commission_rate != null ? String(v.commission_rate) : "")
                    }
                    placeholder="Comm %"
                    onChange={(e) =>
                      setCommissionDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))
                    }
                    onBlur={() => saveCommission(v.id, commissionDrafts[v.id])}
                  />
                  <button
                    type="button"
                    onClick={() => deleteVendor(v.id)}
                    disabled={deletingId === v.id}
                    className="text-xs px-2 py-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === v.id ? "…" : "Delete"}
                  </button>
                </div>
                {showDetailsId === v.id && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-md w-full relative">
                      <button className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-900" onClick={() => setShowDetailsId(null)}>
                        <span className="material-icons">close</span>
                      </button>
                      <div className="flex flex-col items-center gap-2">
                        {detailsPic ? (
                          <img src={detailsPic} alt="Profile" className="w-20 h-20 rounded-full object-cover border mb-2" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 mb-2">No photo</div>
                        )}
                        <div className="font-bold text-lg">{details?.business_name ?? v.business_name}</div>
                        {details?.description && <div className="text-sm text-zinc-600 mb-2">{details.description}</div>}
                        <div className="text-xs text-zinc-500">Joined: {/* TODO: show join date */}</div>
                        <div className="text-xs text-zinc-500">Approved: {/* TODO: show approval date */}</div>
                        {/* Show all other details from signup */}
                        <div className="mt-2 text-xs text-zinc-700 text-left w-full">
                          {details && Object.entries(details).map(([k, v]) => (
                            <div key={k}><span className="font-bold">{k.replace(/_/g, " ")}: </span>{String(v)}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
