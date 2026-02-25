'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CartItem = {
  productId: string;
  name: string;
  vendorName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type CartResponse = {
  cart: { id: string } | null;
  items: CartItem[];
  subtotal: number;
};

export default function CartPage() {
  const router = useRouter();
  const [data, setData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "bank_transfer">("paystack");
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  async function loadCart() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/cart/me`, {
        credentials: "include",
      });
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      const json = (await res.json()) as CartResponse;
      setData(json);
    } catch {
      setError("Failed to load cart.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateQuantity(productId: string, quantity: number) {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/cart/items/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Failed to update cart.");
        return;
      }
      const json = (await res.json()) as CartResponse;
      setData(json);
    } catch {
      setError("Failed to update cart.");
    }
  }

  async function checkout() {
    if (!address.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    try {
      setError(null);
      setCheckoutLoading(true);
      const res = await fetch(`${API_BASE}/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ deliveryAddress: address, paymentMethod }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message ?? "Checkout failed.");
        return;
      }
      if (paymentMethod === "bank_transfer") {
        setPendingPaymentId(body?.payment?.id ?? null);
      }
      if (paymentMethod === "paystack" && body?.paystack?.authorizationUrl) {
        window.location.href = body.paystack.authorizationUrl as string;
        return;
      }
      if (paymentMethod === "bank_transfer") {
        const bank = body?.bankTransfer;
        if (bank?.bankAccountNumber) {
          alert(
            `Please transfer ₦${(data?.subtotal ?? 0).toLocaleString()} to:\n` +
              `${bank.bankAccountName || "Account name"}\n` +
              `${bank.bankAccountNumber} (${bank.bankName || "Bank"})`,
          );
        }
      }
      router.push("/"); // later: redirect to order confirmation page
    } catch {
      setError("Checkout failed.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading && !data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-600">Loading cart...</p>
      </main>
    );
  }

  const items = data?.items ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-6 space-y-4">
        <h1 className="text-2xl font-bold">Your Cart</h1>
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-md">
            {error}
          </div>
        )}
        {items.length === 0 ? (
          <p className="text-zinc-600">Your cart is empty.</p>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between border-b border-zinc-100 pb-3"
                >
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-xs text-zinc-500">
                      {item.vendorName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      ₦{item.unitPrice.toLocaleString()} each
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          Math.max(0, item.quantity - 1),
                        )
                      }
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      className="px-2 py-1 border rounded"
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                    <div className="w-20 text-right font-semibold">
                      ₦{item.lineTotal.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-zinc-100">
              <div className="text-sm text-zinc-600">
                Subtotal:{" "}
                <span className="font-semibold text-zinc-900">
                  ₦{(data?.subtotal ?? 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="space-y-3 pt-2">
              <div>
                <span className="block text-sm font-medium mb-1">
                  Payment method
                </span>
                <div className="flex flex-col sm:flex-row gap-2 text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={paymentMethod === "paystack"}
                      onChange={() => setPaymentMethod("paystack")}
                    />
                    Paystack (card/online)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === "bank_transfer"}
                      onChange={() => setPaymentMethod("bank_transfer")}
                    />
                    Bank transfer
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Delivery address
                </label>
                <textarea
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              {paymentMethod === "bank_transfer" && pendingPaymentId && (
                <div className="space-y-2 border border-dashed border-zinc-200 rounded-md p-3">
                  <p className="text-xs text-zinc-600">
                    After making the bank transfer, upload your payment receipt
                    here so the system and admin can verify it.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setReceiptFile(e.target.files?.[0] ?? null)
                    }
                    className="text-xs"
                  />
                  <button
                    type="button"
                    disabled={!receiptFile || uploadingReceipt}
                    className="px-3 py-1 bg-secondary text-white rounded-md text-xs disabled:opacity-60"
                    onClick={async () => {
                      if (!receiptFile || !pendingPaymentId) return;
                      try {
                        setUploadingReceipt(true);
                        setError(null);
                        const form = new FormData();
                        form.append("receipt", receiptFile);
                        const res = await fetch(
                          `${API_BASE}/payments/${pendingPaymentId}/receipt`,
                          {
                            method: "POST",
                            credentials: "include",
                            body: form,
                          },
                        );
                        const body = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          setError(
                            body.message ??
                              "Failed to upload receipt. Please try again.",
                          );
                          return;
                        }
                        if (body.autoVerified) {
                          alert(
                            "Receipt uploaded and payment auto-verified. Thank you!",
                          );
                        } else {
                          alert(
                            "Receipt uploaded. Admin will confirm your payment shortly.",
                          );
                        }
                      } catch {
                        setError(
                          "Failed to upload receipt. Please try again later.",
                        );
                      } finally {
                        setUploadingReceipt(false);
                      }
                    }}
                  >
                    {uploadingReceipt ? "Uploading..." : "Upload receipt"}
                  </button>
                </div>
              )}
              <button
                onClick={checkout}
                disabled={checkoutLoading || items.length === 0}
                className="w-full bg-primary text-white py-2 rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {checkoutLoading ? "Processing..." : "Checkout"}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

