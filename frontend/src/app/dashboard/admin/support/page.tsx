"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Ticket = { id: string; subject: string; status: string; created_at: string };

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/admin/support-tickets`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : { data: [] })
      .then((data: { data?: Ticket[] }) => setTickets(data.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Support tickets</h1>
        <p className="text-sm text-zinc-600 mt-0.5">Record and manage support tickets via POST /admin/support-tickets.</p>
      </div>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          No support tickets yet. They will appear here when created via the API.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {tickets.map((t) => (
              <li
                key={t.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1"
              >
                <span className="font-medium text-zinc-900">{t.subject}</span>
                <span className="text-xs text-zinc-500">{t.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
