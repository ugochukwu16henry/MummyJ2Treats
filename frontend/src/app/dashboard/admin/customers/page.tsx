"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
};

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
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
    fetch(`${API_BASE}/users`, opts())
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data: { data?: User[] }) => {
        const list = data.data ?? [];
        setUsers(list.filter((u) => u.role === "customer"));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteUser(id: string) {
    if (!confirm("Permanently delete this customer? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", ...opts() });
      if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Customers</h1>
        <p className="text-sm text-zinc-600 mt-0.5">View and manage customer accounts. You can delete any customer.</p>
      </div>
      {loading ? (
        <p className="text-zinc-500">Loading…</p>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          No customers yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {users.map((u) => (
              <li key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-zinc-900">
                    {u.first_name} {u.last_name}
                  </div>
                  <div className="text-xs text-zinc-500">{u.email}</div>
                  <span className={`text-xs px-2 py-0.5 rounded ${u.is_active ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-600"}`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteUser(u.id)}
                  disabled={deletingId === u.id}
                  className="text-xs px-2 py-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === u.id ? "…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
