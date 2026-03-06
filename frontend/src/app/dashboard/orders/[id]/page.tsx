"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../../_components/SiteHeader";
import { SiteFooter } from "../../../_components/SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type OrderItemDto = { productName: string; quantity: number; unitPrice: number };
type OrderDetail = {
  id: string;
  createdAt: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: string;
  deliveryAddress: string | null;
  items: OrderItemDto[];
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
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
        const data = (await res.json()) as OrderDetail;
        if (!cancelled) setOrder(data);
      } catch {
        if (!cancelled) setOrder(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        <SiteHeader />
        <main className="flex-1 px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-20" style={{ color: "var(--foreground)" }}>Loading order…</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
        <SiteHeader />
        <main className="flex-1 px-4 py-8">
          <div className="max-w-2xl mx-auto text-center py-20">
            <p style={{ color: "var(--foreground)" }}>Order not found.</p>
            <Link href="/dashboard/orders" className="inline-block mt-4 font-medium hover:underline" style={{ color: "var(--primary)" }}>← Order history</Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <SiteHeader />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--foreground)" }}>Order #{order.id.slice(0, 8)}</h1>
            <Link href="/dashboard/orders" className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>← Order history</Link>
          </header>
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-4 sm:p-6 space-y-4" style={{ background: "var(--background)" }}>
            <div className="flex justify-between text-sm">
              <span className="opacity-70" style={{ color: "var(--foreground)" }}>Status</span>
              <span className="font-medium" style={{ color: "var(--foreground)" }}>{order.status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="opacity-70" style={{ color: "var(--foreground)" }}>Placed</span>
              <span style={{ color: "var(--foreground)" }}>{new Date(order.createdAt).toLocaleString()}</span>
            </div>
            {order.deliveryAddress && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="opacity-70 text-sm block mb-1" style={{ color: "var(--foreground)" }}>Delivery address</span>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>{order.deliveryAddress}</p>
              </div>
            )}
            {order.items && order.items.length > 0 && (
              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span className="opacity-70 text-sm block mb-2" style={{ color: "var(--foreground)" }}>Items</span>
                <ul className="space-y-2">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span style={{ color: "var(--foreground)" }}>{item.productName} × {item.quantity}</span>
                      <span style={{ color: "var(--foreground)" }}>₦{(item.quantity * item.unitPrice).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-sm">
              <span className="opacity-70" style={{ color: "var(--foreground)" }}>Subtotal</span>
              <span style={{ color: "var(--foreground)" }}>₦{Number(order.subtotal).toLocaleString()}</span>
            </div>
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="opacity-70" style={{ color: "var(--foreground)" }}>Delivery</span>
                <span style={{ color: "var(--foreground)" }}>₦{Number(order.deliveryFee).toLocaleString()}</span>
              </div>
            )}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between font-semibold">
              <span style={{ color: "var(--foreground)" }}>Total</span>
              <span style={{ color: "var(--primary)" }}>₦{Number(order.total).toLocaleString()}</span>
            </div>
          </div>
          <p className="text-sm opacity-80" style={{ color: "var(--foreground)" }}>
            Need help? <Link href="/support" className="font-medium underline" style={{ color: "var(--primary)" }}>Contact support</Link>.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
