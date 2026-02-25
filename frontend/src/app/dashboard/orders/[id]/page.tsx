"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Order = {
  id: string;
  order_number: string;
  status: string;
  subtotal?: number;
  delivery_fee?: number;
  total_amount: number;
  payment_status: string;
  delivery_address: string | null;
  created_at: string;
  vendor_id?: string;
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`${API_BASE}/orders/me/${id}`, { credentials: "include" });
        if (res.status === 401) {
          router.push("/auth/login");
          return;
        }
        if (res.status === 404 || !res.ok) {
          if (!cancelled) setOrder(null);
          return;
        }
        const data = (await res.json()) as Order;
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-20 text-zinc-500">Loading order…</div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-zinc-600">Order not found.</p>
          <Link href="/dashboard/orders" className="inline-block mt-4 text-primary font-medium hover:underline">← My orders</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Order {order.order_number}</h1>
          <Link href="/dashboard/orders" className="text-sm text-zinc-600 hover:underline">← My orders</Link>
        </header>
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Status</span>
            <span className="font-medium">{order.status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Payment</span>
            <span className="font-medium">{order.payment_status}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500">Placed</span>
            <span>{new Date(order.created_at).toLocaleString()}</span>
          </div>
          {order.delivery_address && (
            <div className="pt-2 border-t border-zinc-100">
              <span className="text-zinc-500 text-sm block mb-1">Delivery address</span>
              <p className="text-sm">{order.delivery_address}</p>
            </div>
          )}
          <div className="pt-2 border-t border-zinc-100 flex justify-between font-semibold">
            <span>Total</span>
            <span>₦{Number(order.total_amount).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </main>
  );
}
