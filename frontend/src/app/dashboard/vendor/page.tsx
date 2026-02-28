"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type VendorProfile = {
  business_name: string;
  description?: string;
  logo_url?: string;
  slug?: string;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  delivery_address: string | null;
  rider_id?: string | null;
  created_at: string;
};

type Rider = { id: string; first_name: string; last_name: string; phone: string | null; transport_type: string | null; is_available: boolean };

type OnboardingStep = { key: string; completed: boolean; completedAt: string | null };
type Bonus = { id: string; period_date: string; amount: number; criteria: string; status: string; created_at: string };

export default function VendorDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorState, setVendorState] = useState<string | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
    const [uploadingPic, setUploadingPic] = useState(false);
    const toFullProfilePicUrl = (url: string | null) =>
      !url ? null : url.startsWith("/") ? `${API_BASE.replace(/\/$/, "")}${url}` : url;
    async function fetchProfilePic() {
      try {
        const res = await fetch(`${API_BASE}/vendors/me/profile-picture`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setProfilePicUrl(toFullProfilePicUrl(data.url ?? null));
        }
      } catch {}
    }
    async function uploadProfilePic(e: React.ChangeEvent<HTMLInputElement>) {
      if (!e.target.files?.[0]) return;
      setUploadingPic(true);
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      try {
        const res = await fetch(`${API_BASE}/vendors/me/profile-image`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (res.ok) await fetchProfilePic();
      } finally {
        setUploadingPic(false);
      }
    }
    useEffect(() => { fetchProfilePic(); }, []);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [onboarding, setOnboarding] = useState<{ steps: OnboardingStep[]; complete: boolean } | null>(null);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);

  async function loadOrders() {
    const res = await fetch(`${API_BASE}/orders/me`, { credentials: "include" });
    if (res.status === 401) { router.push("/auth/login"); return; }
    if (res.status === 403) {
      setOrders([]);
      return;
    }
    const data = (await res.json()) as { data?: Order[] };
    setOrders(data.data ?? []);
  }

  async function loadProfileAndRiders() {
    const profileRes = await fetch(`${API_BASE}/vendors/me/profile`, { credentials: "include" });
    if (profileRes.ok) {
      const profile = await profileRes.json();
      setVendorProfile({
        business_name: profile.business_name ?? "",
        description: profile.description ?? "",
        logo_url: profile.logo_url ?? undefined,
        slug: profile.slug ?? undefined,
      });
      const state = profile.operating_state?.trim();
      setVendorState(state ?? null);
      if (state) {
        const ridersRes = await fetch(`${API_BASE}/riders/by-state?state=${encodeURIComponent(state)}&available=true`, { credentials: "include" });
        if (ridersRes.ok) {
          const r = (await ridersRes.json()) as { data?: Rider[] };
          setRiders(r.data ?? []);
        }
      }
    }
    // Onboarding steps
    try {
      const onboardingRes = await fetch(`${API_BASE}/moat/onboarding`, { credentials: "include" });
      if (onboardingRes.ok) {
        const data = await onboardingRes.json();
        setOnboarding(data);
      }
    } catch {}
    // Vendor bonuses
    try {
      const bonusRes = await fetch(`${API_BASE}/moat/vendor-bonuses`, { credentials: "include" });
      if (bonusRes.ok) {
        const data = await bonusRes.json();
        setBonuses(Array.isArray(data.data) ? data.data : []);
      }
    } catch {}
  }

  useEffect(() => {
    let cancelled = false;
    const timeoutMs = 15000;
    async function run() {
      try {
        const timeoutPromise = new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeoutMs)
        );
        const work = (async () => {
          await fetch(`${API_BASE}/auth/become-vendor`, {
            method: "POST",
            credentials: "include",
          }).catch(() => {});
          await Promise.all([loadOrders(), loadProfileAndRiders()]);
        })();
        await Promise.race([work, timeoutPromise]);
      } catch {
        if (!cancelled) {
          setOrders([]);
          setVendorProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [router]);

  async function assignRider(orderId: string, riderId: string) {
    try {
      setAssigningOrderId(orderId);
      const res = await fetch(`${API_BASE}/riders/orders/${orderId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ riderId }),
      });
      if (res.ok) await loadOrders();
    } finally {
      setAssigningOrderId(null);
    }
  }

  async function updateOrderStatus(orderId: string, status: string) {
    if (!status) return;
    try {
      setUpdatingStatusId(orderId);
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadOrders();
      }
    } finally {
      setUpdatingStatusId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 text-zinc-500">
        Loading overview…
      </div>
    );
  }

  // Basic analytics
  const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const completedOrders = orders.filter(o => o.status === "DELIVERED").length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 w-full">
        {/* Onboarding checklist */}
        {onboarding && onboarding.steps && onboarding.steps.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Onboarding Checklist</h2>
            <ul className="space-y-1">
              {onboarding.steps.map((step) => (
                <li key={step.key} className="flex items-center gap-2 text-sm">
                  <span className={`inline-block w-3 h-3 rounded-full ${step.completed ? "bg-green-500" : "bg-zinc-300"}`}></span>
                  <span className={step.completed ? "line-through text-zinc-400" : ""}>{step.key.replace(/_/g, " ")}</span>
                  {step.completed && step.completedAt && (
                    <span className="text-xs text-zinc-400 ml-2">({new Date(step.completedAt).toLocaleDateString()})</span>
                  )}
                </li>
              ))}
            </ul>
            {onboarding.complete && <div className="mt-2 text-green-700 text-sm font-medium">Onboarding complete!</div>}
          </section>
        )}

        {/* Vendor bonuses */}
        {bonuses && bonuses.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-2">Performance Bonuses</h2>
            <ul className="space-y-2">
              {bonuses.map((b) => (
                <li key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm border-b border-zinc-100 pb-2 last:border-0 last:pb-0">
                  <div>
                    <span className="font-medium">₦{b.amount.toLocaleString()}</span> for <span className="font-mono">{b.period_date}</span>
                    {b.criteria && <span className="ml-2 text-xs text-zinc-500">({b.criteria})</span>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${b.status === "paid" ? "bg-green-100 text-green-700" : b.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-zinc-100 text-zinc-700"}`}>{b.status}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <header className="pb-2">
          <h1 className="text-2xl font-bold">Overview</h1>
        </header>

        {/* Vendor profile summary */}
        {vendorProfile && (
            <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="relative">
                <button
                  className="absolute top-0 right-0 bg-zinc-900 text-white rounded-full p-1 text-xs"
                  title="View profile"
                  onClick={() => setShowProfileModal(true)}
                >
                  <span className="material-icons">account_circle</span>
                </button>
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border" />
                ) : vendorProfile.logo_url ? (
                  <img src={vendorProfile.logo_url} alt="Logo" className="w-16 h-16 rounded-full object-cover border" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">No photo</div>
                )}
                <label className="block mt-2 text-xs text-primary cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={uploadProfilePic} disabled={uploadingPic} />
                  {uploadingPic ? "Uploading…" : "Add/Change photo"}
                </label>
              </div>
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-semibold mb-1">{vendorProfile.business_name}</h2>
                {vendorProfile.description && (
                  <p className="text-zinc-600 text-sm mb-1">{vendorProfile.description}</p>
                )}
                <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 justify-center sm:justify-start">
                  {vendorProfile.slug && (
                    <Link href={`/vendor/${vendorProfile.slug}`} target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline text-sm">
                      View my store page →
                    </Link>
                  )}
                  <Link href="/dashboard/vendor/location" className="text-primary font-medium hover:underline text-sm">Location &amp; delivery</Link>
                  <Link href="/dashboard/vendor/products" className="text-primary font-medium hover:underline text-sm">Manage products</Link>
                  <Link href="/dashboard/vendor/blog" className="text-primary font-medium hover:underline text-sm">Blog</Link>
                </div>
              </div>
              {showProfileModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full relative">
                    <button className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-900" onClick={() => setShowProfileModal(false)}>
                      <span className="material-icons">close</span>
                    </button>
                    <div className="flex flex-col items-center gap-2">
                      {profilePicUrl ? (
                        <img src={profilePicUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover border mb-2" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 mb-2">No photo</div>
                      )}
                      <div className="font-bold text-lg">{vendorProfile.business_name}</div>
                      {vendorProfile.description && <div className="text-sm text-zinc-600 mb-2">{vendorProfile.description}</div>}
                      <div className="text-xs text-zinc-500">Joined: {/* TODO: show join date */}</div>
                      <div className="text-xs text-zinc-500">Approved: {/* TODO: show approval date */}</div>
                    </div>
                  </div>
                </div>
              )}
            </section>
        )}
        <section className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row gap-6 sm:gap-8 items-start sm:items-center">
          <div>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-zinc-500">Total Revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <div className="text-xs text-zinc-500">Orders Delivered</div>
          </div>
        </section>

        {/* Orders and rider assignment */}
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Your Orders</h2>
          {orders.length === 0 ? (
            <p className="text-zinc-500 text-sm">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-zinc-100 last:border-0">
                  <div>
                    <span className="font-mono text-sm">{o.order_number}</span>
                    <span className="mx-2 text-zinc-400">·</span>
                    <span className="text-sm text-zinc-600">{o.status}</span>
                    {o.rider_id && <span className="ml-2 text-xs text-green-600">Rider assigned</span>}
                  </div>
                  <span className="font-medium">₦{Number(o.total_amount).toLocaleString()}</span>
                  <select
                    className="text-xs border border-zinc-300 rounded px-2 py-1"
                    value={o.status}
                    disabled={updatingStatusId === o.id}
                    onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                  >
                    {["PENDING", "PAID", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {!o.rider_id && vendorState && riders.length > 0 && ["PAID", "PREPARING", "OUT_FOR_DELIVERY"].includes(o.status) && (
                    <select
                      className="text-sm border border-zinc-300 rounded px-2 py-1"
                      disabled={assigningOrderId === o.id}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) assignRider(o.id, id);
                      }}
                    >
                      <option value="">Assign rider</option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.first_name} {r.last_name} {r.transport_type ? `(${r.transport_type})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
    </div>
  );
}
