"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function VendorLocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [operatingState, setOperatingState] = useState("");
  const [operatingCity, setOperatingCity] = useState("");
  const [operatingLga, setOperatingLga] = useState("");
  const [vendorLatitude, setVendorLatitude] = useState<number | null>(null);
  const [vendorLongitude, setVendorLongitude] = useState<number | null>(null);
  const [deliverOutsideState, setDeliverOutsideState] = useState(false);
  const [maxDeliveryRadiusKm, setMaxDeliveryRadiusKm] = useState("");
  const [deliveryPricePerKm, setDeliveryPricePerKm] = useState("");
  const [deliveryMinFee, setDeliveryMinFee] = useState("");
  const [deliveryFixedCityRate, setDeliveryFixedCityRate] = useState("");
  const [interStateDeliveryFee, setInterStateDeliveryFee] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`${API_BASE}/vendors/me/profile`, { credentials: "include" });
        if (res.status === 401) { router.push("/auth/login"); return; }
        if (res.status === 403) { router.push("/dashboard"); return; }
        if (res.ok) {
          const p = (await res.json()) as Record<string, unknown>;
          if (!cancelled) {
            setOperatingState((p.operating_state as string) ?? "");
            setOperatingCity((p.operating_city as string) ?? "");
            setOperatingLga((p.operating_lga as string) ?? "");
            setVendorLatitude(p.vendor_latitude != null ? Number(p.vendor_latitude) : null);
            setVendorLongitude(p.vendor_longitude != null ? Number(p.vendor_longitude) : null);
            setDeliverOutsideState(Boolean(p.deliver_outside_state));
            setMaxDeliveryRadiusKm(p.max_delivery_radius_km != null ? String(p.max_delivery_radius_km) : "");
            setDeliveryPricePerKm(p.delivery_price_per_km != null ? String(p.delivery_price_per_km) : "");
            setDeliveryMinFee(p.delivery_min_fee != null ? String(p.delivery_min_fee) : "");
            setDeliveryFixedCityRate(p.delivery_fixed_city_rate != null ? String(p.delivery_fixed_city_rate) : "");
            setInterStateDeliveryFee(p.inter_state_delivery_fee != null ? String(p.inter_state_delivery_fee) : "");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [router]);

  function captureLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setVendorLatitude(pos.coords.latitude);
        setVendorLongitude(pos.coords.longitude);
      },
      () => {},
    );
  }

  async function save() {
    try {
      setSaving(true);
      const res = await fetch(`${API_BASE}/vendors/me/location-and-delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operatingState: operatingState.trim() || undefined,
          operatingCity: operatingCity.trim() || undefined,
          operatingLga: operatingLga.trim() || undefined,
          vendorLatitude: vendorLatitude ?? undefined,
          vendorLongitude: vendorLongitude ?? undefined,
          deliverOutsideState: deliverOutsideState,
          maxDeliveryRadiusKm: maxDeliveryRadiusKm ? parseFloat(maxDeliveryRadiusKm) : undefined,
          deliveryPricePerKm: deliveryPricePerKm ? parseFloat(deliveryPricePerKm) : undefined,
          deliveryMinFee: deliveryMinFee ? parseFloat(deliveryMinFee) : undefined,
          deliveryFixedCityRate: deliveryFixedCityRate ? parseFloat(deliveryFixedCityRate) : undefined,
          interStateDeliveryFee: interStateDeliveryFee ? parseFloat(interStateDeliveryFee) : undefined,
        }),
      });
      if (res.ok) alert("Saved.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-20 text-zinc-500">Loading…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Location & delivery</h1>
          <Link href="/dashboard/vendor" className="text-sm text-zinc-600 hover:underline">← Vendor dashboard</Link>
        </header>
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-zinc-800">Operating location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label htmlFor="vendor-state" className="sr-only">State</label>
            <input id="vendor-state" name="operatingState" type="text" placeholder="State" className="border border-zinc-300 rounded-md px-3 py-2" value={operatingState} onChange={(e) => setOperatingState(e.target.value)} />
            <label htmlFor="vendor-city" className="sr-only">City</label>
            <input id="vendor-city" name="operatingCity" type="text" placeholder="City" className="border border-zinc-300 rounded-md px-3 py-2" value={operatingCity} onChange={(e) => setOperatingCity(e.target.value)} />
            <label htmlFor="vendor-lga" className="sr-only">LGA</label>
            <input id="vendor-lga" name="operatingLga" type="text" placeholder="LGA" className="border border-zinc-300 rounded-md px-3 py-2 sm:col-span-2" value={operatingLga} onChange={(e) => setOperatingLga(e.target.value)} />
          </div>
          <div>
            <button type="button" onClick={captureLocation} className="text-sm py-2 px-3 border border-primary text-primary rounded-md">Use my current location</button>
            {vendorLatitude != null && vendorLongitude != null && <span className="ml-2 text-xs text-zinc-600">{vendorLatitude.toFixed(5)}, {vendorLongitude.toFixed(5)}</span>}
          </div>

          <h2 className="font-semibold text-zinc-800 pt-4">Delivery pricing</h2>
          <label className="flex items-center gap-2 text-sm"><input id="vendor-deliver-outside" name="deliverOutsideState" type="checkbox" checked={deliverOutsideState} onChange={(e) => setDeliverOutsideState(e.target.checked)} /> Deliver outside my state</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label htmlFor="vendor-max-radius" className="sr-only">Max radius (km)</label>
            <input id="vendor-max-radius" name="maxDeliveryRadiusKm" type="number" step="0.1" placeholder="Max radius (km)" className="border border-zinc-300 rounded-md px-3 py-2" value={maxDeliveryRadiusKm} onChange={(e) => setMaxDeliveryRadiusKm(e.target.value)} />
            <label htmlFor="vendor-price-per-km" className="sr-only">Price per km (₦)</label>
            <input id="vendor-price-per-km" name="deliveryPricePerKm" type="number" step="0.01" placeholder="Price per km (₦)" className="border border-zinc-300 rounded-md px-3 py-2" value={deliveryPricePerKm} onChange={(e) => setDeliveryPricePerKm(e.target.value)} />
            <label htmlFor="vendor-min-fee" className="sr-only">Min delivery fee (₦)</label>
            <input id="vendor-min-fee" name="deliveryMinFee" type="number" step="0.01" placeholder="Min delivery fee (₦)" className="border border-zinc-300 rounded-md px-3 py-2" value={deliveryMinFee} onChange={(e) => setDeliveryMinFee(e.target.value)} />
            <label htmlFor="vendor-fixed-city" className="sr-only">Fixed city rate (₦)</label>
            <input id="vendor-fixed-city" name="deliveryFixedCityRate" type="number" step="0.01" placeholder="Fixed city rate (₦)" className="border border-zinc-300 rounded-md px-3 py-2" value={deliveryFixedCityRate} onChange={(e) => setDeliveryFixedCityRate(e.target.value)} />
            <label htmlFor="vendor-interstate-fee" className="sr-only">Inter-state fee (₦)</label>
            <input id="vendor-interstate-fee" name="interStateDeliveryFee" type="number" step="0.01" placeholder="Inter-state fee (₦)" className="border border-zinc-300 rounded-md px-3 py-2 sm:col-span-2" value={interStateDeliveryFee} onChange={(e) => setInterStateDeliveryFee(e.target.value)} />
          </div>
          <button onClick={save} disabled={saving} className="w-full bg-primary text-white py-2 rounded-md font-medium disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </main>
  );
}
