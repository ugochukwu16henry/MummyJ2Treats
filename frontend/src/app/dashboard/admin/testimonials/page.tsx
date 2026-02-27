"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Testimonial = {
  id: string;
  content: string;
  image_url?: string | null;
  target_type: "founder" | "vendor";
  created_at: string;
  first_name?: string | null;
  last_name?: string | null;
  vendor_name?: string | null;
  vendor_slug?: string | null;
};

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setError(null);
      const cookie = typeof document !== "undefined"
        ? document.cookie.split("; ").find((c) => c.startsWith("access_token="))
        : undefined;
      const token = cookie?.split("=")[1];
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/testimonials?status=pending`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        setError("Failed to load pending testimonials. Make sure you are logged in as founder admin.");
        setItems([]);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { data?: Testimonial[] };
      setItems(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    try {
      setApprovingId(id);
      await fetch(`${API_BASE}/testimonials/${id}/approve`, {
        method: "PATCH",
        credentials: "include",
      });
      await load();
    } finally {
      setApprovingId(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Testimonials moderation</h1>
        <p className="text-sm text-zinc-600 mt-0.5">
          Approve customer testimonials for the homepage and vendor stores.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          No pending testimonials.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {items.map((t) => (
              <li key={t.id} className="p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs uppercase text-zinc-500 mb-1">
                    {t.target_type === "founder"
                      ? "Homepage (founder)"
                      : `Vendor: ${t.vendor_name ?? t.vendor_slug ?? "Unknown"}`}
                  </div>
                  <p className="text-sm text-zinc-800">“{t.content}”</p>
                  <div className="text-xs text-zinc-500 mt-1">
                    {t.first_name ? `${t.first_name} ${t.last_name ?? ""}`.trim() : "Customer"} ·{" "}
                    {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => approve(t.id)}
                    disabled={approvingId === t.id}
                    className="text-xs px-3 py-1 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {approvingId === t.id ? "Approving…" : "Approve"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

