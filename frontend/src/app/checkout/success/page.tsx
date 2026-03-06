import { Suspense } from "react";
import { CheckoutSuccessClient } from "./CheckoutSuccessClient";

// Prevent static prerender: this page uses searchParams (orderId, payment) only available at request time.
export const dynamic = "force-dynamic";

function SuccessFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <p style={{ color: "var(--foreground)" }}>Loading…</p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
