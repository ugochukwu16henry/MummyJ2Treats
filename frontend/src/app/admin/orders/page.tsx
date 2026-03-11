"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../../../lib/apiBase";

type OrderStatus = "Pending" | "Approved" | "Rejected" | "Delivered";

type Order = {
  orderId: string;
  customerName: string;
  orderDate: string;
  totalAmount: number;
  status: OrderStatus;
  bankReceiptImageUrl?: string | null;
  receiptPdfUrl?: string | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
        const res = await fetch(`${API_BASE}/admin/orders`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setError("Failed to load orders (check admin token and API).");
          return;
        }
        const data = (await res.json()) as Order[];
        setOrders(data);
      } catch {
        setError("Cannot reach backend API.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function approve(orderId: string) {
    try {
      setApprovingId(orderId);
      setError(null);
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(`${API_BASE}/admin/orders/${orderId}/approve`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.message ?? "Failed to approve order.");
        return;
      }
      const updated = body.order as Order | undefined;
      if (updated) {
        setOrders((prev) => prev.map((o) => (o.orderId === updated.orderId ? updated : o)));
      }
      alert("Order approved and PDF generated.");
    } catch {
      setError("Network error while approving order.");
    } finally {
      setApprovingId(null);
    }
  }

  function initials(name: string) {
    if (!name) return "MJ";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function timeAgo(iso: string) {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const pending = orders.filter((o) => o.status === "Pending");

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Pending bank transfers</h1>
            <p className="text-sm text-gray-500">
              Review receipts, approve payments, and send PDF receipts for MummyJ2Treats orders.
            </p>
          </div>
        </header>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-gray-500">Loading orders…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-gray-500">No pending orders right now.</p>
        ) : (
          <div className="mt-2 rounded-2xl border border-gray-100 bg-white overflow-hidden">
            {pending.map((order) => (
              <div
                key={order.orderId}
                className="bg-white border-b border-gray-100 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                    {initials(order.customerName)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                    <p className="text-xs text-gray-400">
                      Order #{order.orderId.toString().slice(0, 8).toUpperCase()} • {timeAgo(order.orderDate)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end gap-1">
                  <p className="font-bold text-gray-800">₦{order.totalAmount.toLocaleString()}</p>
                  <span className="text-[10px] uppercase tracking-wider text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">
                    Pending Verification
                  </span>
                </div>

                <div className="flex gap-2 items-center">
                  {order.bankReceiptImageUrl && (
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="View Bank Screenshot"
                      onClick={() => window.open(order.bankReceiptImageUrl ?? "#", "_blank")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 3h6v6" />
                        <path d="M10 14L21 3" />
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      </svg>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={approvingId === order.orderId}
                    onClick={() => approve(order.orderId)}
                    className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 shadow-sm shadow-green-200 disabled:opacity-60"
                  >
                    {approvingId === order.orderId ? "Approving…" : "Approve & Send PDF"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

