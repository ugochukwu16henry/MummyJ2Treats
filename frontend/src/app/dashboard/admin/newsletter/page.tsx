"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Subscription = {
  id: string;
  email: string;
  created_at: string;
};

export default function AdminNewsletterPage() {
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setError(null);
      const cookie =
        typeof document !== "undefined"
          ? document.cookie.split("; ").find((c) => c.startsWith("access_token="))
          : undefined;
      const token = cookie?.split("=")[1];
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_BASE}/newsletter`, {
        credentials: "include",
        headers,
      });
      if (!res.ok) {
        let message = "Failed to load newsletter emails.";
        if (res.status === 401) {
          message += " You are not logged in. Please log in again as founder admin.";
        } else if (res.status === 403) {
          message += " Your account does not have founder admin access.";
        }
        message += ` (HTTP ${res.status})`;
        setError(message);
        setItems([]);
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { data?: Subscription[] };
      setItems(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Newsletter subscribers</h1>
        <p className="text-sm text-zinc-600 mt-0.5">
          Emails collected from the homepage newsletter form for follow-up and email marketing.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          No newsletter subscribers yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-zinc-700">Email</th>
                <th className="text-left px-4 py-2 font-medium text-zinc-700">Subscribed at</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100">
                  <td className="px-4 py-2">{s.email}</td>
                  <td className="px-4 py-2 text-xs text-zinc-500">
                    {new Date(s.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

