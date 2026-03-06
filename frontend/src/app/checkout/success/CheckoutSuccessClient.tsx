"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";
  const isBankTransfer = searchParams.get("payment") === "bank_transfer";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16" style={{ background: "var(--background)" }}>
        <div className="max-w-md w-full text-center">
          <div className="mb-6 flex justify-center">
            <span className="material-icons text-6xl" style={{ color: "var(--success)" }}>check_circle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Thank you for your order
          </h1>
          <p className="text-sm opacity-90 mb-4" style={{ color: "var(--foreground)" }}>
            We've received your order and will prepare it fresh. You'll get updates by email if we have your address.
          </p>
          {orderId && (
            <p className="text-sm font-mono mb-4 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 inline-block" style={{ color: "var(--foreground)" }}>
              Order ID: {orderId.slice(0, 8)}…
            </p>
          )}
          {isBankTransfer && (
            <div className="mb-6 p-4 rounded-lg border text-left text-sm" style={{ borderColor: "var(--primary)", color: "var(--foreground)" }}>
              <p className="font-medium mb-2">Complete payment by bank transfer</p>
              <p>Pay to: <strong>Marylou Ihechi Okechukwu</strong></p>
              <p>Bank: Opay · Account: 9068042947</p>
              <p className="mt-2 opacity-90">Upload your receipt from your order page after payment.</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={orderId ? `/dashboard/orders/${orderId}` : "/dashboard/orders"}
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-semibold text-white text-sm"
              style={{ backgroundColor: "var(--primary)" }}
            >
              View order
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-semibold border-2 text-sm"
              style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
