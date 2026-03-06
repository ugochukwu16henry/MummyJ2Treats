"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CartItem = {
  productId: string;
  name: string;
  vendorName?: string;
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
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryLga, setDeliveryLga] = useState("");
  const [deliveryStreet, setDeliveryStreet] = useState("");
  const [deliveryLandmark, setDeliveryLandmark] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [useMyLocation, setUseMyLocation] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
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

  function captureLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setUseMyLocation(true);
      },
      () => setLocationError("Could not get your location. Please allow location access or enter address manually."),
    );
  }

  async function checkout() {
    const hasManual = [deliveryStreet, deliveryCity, deliveryState].some((s) => s.trim());
    const hasLocation = latitude != null && longitude != null;
    const hasLegacy = address.trim().length > 0;
    if (!hasManual && !hasLocation && !hasLegacy) {
      setError("Please enter a delivery address or use your current location.");
      return;
    }
    try {
      setError(null);
      setCheckoutLoading(true);
      const deliveryAddress =
        address.trim() ||
        [deliveryStreet, deliveryLandmark, deliveryLga, deliveryCity, deliveryState].filter(Boolean).join(", ");

      const itemsForOrder =
        (data?.items ?? []).map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })) ?? [];

      const createOrderPayload = {
        items: itemsForOrder,
        addressLine1: deliveryAddress || deliveryStreet || "Delivery address",
        addressLine2: deliveryLandmark || null,
        city: deliveryCity || null,
        state: deliveryState || null,
        country: "Nigeria",
        postalCode: null as string | null,
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
        deliveryFee: 0, // TODO: compute from distance pricing
      };

      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createOrderPayload),
      });
      const orderJson = await orderRes.json().catch(() => ({} as any));
      if (!orderRes.ok) {
        setError(orderJson?.message ?? "Checkout failed while creating order.");
        return;
      }

      const orderId = orderJson?.id as string | undefined;
      if (!orderId) {
        setError("Order was created but an ID was not returned.");
        return;
      }

      if (paymentMethod === "paystack") {
        const initRes = await fetch(`${API_BASE}/payments/initialize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ orderId, provider: "paystack" }),
        });
        const initJson = await initRes.json().catch(() => ({} as any));
        if (!initRes.ok || !initJson?.paymentUrl) {
          setError(initJson?.message ?? "Failed to initialize online payment.");
          return;
        }
        window.location.href = initJson.paymentUrl as string;
        return;
      }

      if (paymentMethod === "bank_transfer") {
        setPendingPaymentId(orderId);
        alert(
          `Order created successfully.\n\nPlease transfer ₦${(data?.subtotal ?? 0).toLocaleString()} to:\n` +
            `Account name: Marylou Ihechi Okechukwu\n` +
            `Bank: Opay\n` +
            `Account number: 9068042947\n\n` +
            `After payment, upload your transfer receipt here so we can verify and confirm your order.`,
        );
      }
      // For bank transfer we stay on the page so user can upload receipt.
    } catch {
      setError("Checkout failed.");
    } finally {
      setCheckoutLoading(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center py-20" style={{ color: "var(--foreground)" }}>
          Loading cart…
        </main>
        <SiteFooter />
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 py-8" style={{ background: "var(--background)" }}>
        <div className="max-w-4xl mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md p-6 space-y-4" style={{ background: "var(--background)" }}>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Your Cart</h1>
          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--error)", color: "white" }}>
              {error}
            </div>
          )}
          {items.length === 0 ? (
            <p className="opacity-90" style={{ color: "var(--foreground)" }}>
              Your cart is empty. <Link href="/categories" className="font-medium underline" style={{ color: "var(--primary)" }}>Browse the shop</Link> to add treats.
            </p>
          ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3"
                >
                  <div>
                    <div className="font-semibold" style={{ color: "var(--foreground)" }}>{item.name}</div>
                    {item.vendorName && (
                      <div className="text-xs opacity-70" style={{ color: "var(--foreground)" }}>{item.vendorName}</div>
                    )}
                    <div className="text-xs text-zinc-500">
                      ₦{item.unitPrice.toLocaleString()} each
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="px-2.5 py-1 border rounded-md text-sm font-medium transition-colors hover:opacity-90"
                      style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          Math.max(0, item.quantity - 1),
                        )
                      }
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm" style={{ color: "var(--foreground)" }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-md text-sm font-medium text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "var(--primary)" }}
                      onClick={() =>
                        updateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                    <div className="w-20 text-right font-semibold" style={{ color: "var(--foreground)" }}>
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
              <div className="space-y-3">
                <span className="block text-sm font-medium">Delivery address</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <label htmlFor="checkout-state" className="sr-only">State</label>
                  <input
                    id="checkout-state"
                    name="deliveryState"
                    type="text"
                    autoComplete="address-level1"
                    placeholder="State"
                    className="border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={deliveryState}
                    onChange={(e) => setDeliveryState(e.target.value)}
                  />
                  <label htmlFor="checkout-city" className="sr-only">City</label>
                  <input
                    id="checkout-city"
                    name="deliveryCity"
                    type="text"
                    autoComplete="address-level2"
                    placeholder="City"
                    className="border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                  />
                  <label htmlFor="checkout-lga" className="sr-only">LGA</label>
                  <input
                    id="checkout-lga"
                    name="deliveryLga"
                    type="text"
                    autoComplete="address-level3"
                    placeholder="LGA"
                    className="border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                    value={deliveryLga}
                    onChange={(e) => setDeliveryLga(e.target.value)}
                  />
                  <label htmlFor="checkout-street" className="sr-only">Street address</label>
                  <input
                    id="checkout-street"
                    name="deliveryStreet"
                    type="text"
                    autoComplete="street-address"
                    placeholder="Street address"
                    className="border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                    value={deliveryStreet}
                    onChange={(e) => setDeliveryStreet(e.target.value)}
                  />
                  <label htmlFor="checkout-landmark" className="sr-only">Landmark (optional)</label>
                  <input
                    id="checkout-landmark"
                    name="deliveryLandmark"
                    type="text"
                    autoComplete="off"
                    placeholder="Landmark (optional)"
                    className="border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                    value={deliveryLandmark}
                    onChange={(e) => setDeliveryLandmark(e.target.value)}
                  />
                  <label htmlFor="checkout-notes" className="sr-only">Delivery notes (optional)</label>
                  <input
                    id="checkout-notes"
                    name="deliveryNotes"
                    type="text"
                    autoComplete="off"
                    placeholder="Delivery notes (optional)"
                    className="border border-zinc-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary sm:col-span-2"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={captureLocation}
                    className="text-sm py-2 px-3 border border-primary text-primary rounded-md hover:bg-primary/5"
                  >
                    Use my current location
                  </button>
                  {useMyLocation && latitude != null && longitude != null && (
                    <p className="text-xs text-green-700">
                      Location captured: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                    </p>
                  )}
                  {locationError && (
                    <p className="text-xs text-red-600">{locationError}</p>
                  )}
                </div>
                <p className="text-xs text-zinc-500">
                  Or enter a single address below:
                </p>
                <label htmlFor="checkout-full-address" className="sr-only">Full address (if not using fields above)</label>
                <textarea
                  id="checkout-full-address"
                  name="address"
                  autoComplete="street-address"
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  placeholder="Full address (if not using fields above)"
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
                  <label htmlFor="checkout-receipt" className="block text-sm font-medium mb-1">Payment receipt (image)</label>
                  <input
                    id="checkout-receipt"
                    name="receipt"
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
                        form.append("file", receiptFile);

                        // In this version, the frontend is responsible for uploading the file
                        // (e.g. to your bucket) and then passing the resulting URL to the API.
                        // For now, we assume a helper endpoint or client upload that returns a URL.
                        const uploadRes = await fetch(`${API_BASE}/uploads/receipts`, {
                          method: "POST",
                          credentials: "include",
                          body: form,
                        });
                        const uploadJson = await uploadRes.json().catch(() => ({} as any));
                        if (!uploadRes.ok || !uploadJson?.url) {
                          setError(
                            uploadJson?.message ??
                              "Failed to upload receipt image. Please try again.",
                          );
                          return;
                        }

                        const res = await fetch(`${API_BASE}/payments/bank-transfer`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({
                            orderId: pendingPaymentId,
                            receiptUrl: uploadJson.url as string,
                          }),
                        });
                        const body = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          setError(
                            body.message ??
                              "Failed to record bank transfer. Please try again.",
                          );
                          return;
                        }
                        alert(
                          "Receipt uploaded. Admin will confirm your payment shortly.",
                        );
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
                className="w-full py-3 rounded-lg text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 transition-opacity"
                style={{ backgroundColor: "var(--primary)" }}
              >
                {checkoutLoading ? "Processing…" : "Checkout"}
              </button>
            </div>
          </>
        )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

