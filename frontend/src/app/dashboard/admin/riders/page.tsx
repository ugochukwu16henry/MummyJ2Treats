"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Rider = {
  id: string;
  user_id: string;
  phone: string | null;
  state: string;
  cities: string[] | string | null;
  transport_type: string | null;
  is_available: boolean;
  first_name?: string;
  last_name?: string;
};

export default function AdminRidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getAuthHeaders = (): HeadersInit => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    const token = cookie?.replace(/^access_token=/, "").trim();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const opts = () => ({ credentials: "include" as RequestCredentials, headers: getAuthHeaders() });

  function load() {
    setLoading(true);
    fetch(`${API_BASE}/riders`, opts())
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data: { data?: Rider[] }) => setRiders(data.data ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteRider(id: string) {
    if (!confirm("Permanently remove this rider? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/riders/${id}`, { method: "DELETE", ...opts() });
      if (res.ok) setRiders((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Riders</h1>
        <p className="text-sm text-zinc-600 mt-0.5">View and manage rider accounts. You can delete any rider.</p>
      </div>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : riders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          No riders yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {riders.map((r) => (
              <li key={r.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-zinc-900">
                    {r.first_name} {r.last_name}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {r.state} · {r.phone ?? "—"} · {r.transport_type ?? "—"}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${r.is_available ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"}`}>
                    {r.is_available ? "Available" : "Unavailable"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteRider(r.id)}
                  disabled={deletingId === r.id}
                  className="text-xs px-2 py-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === r.id ? "…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
