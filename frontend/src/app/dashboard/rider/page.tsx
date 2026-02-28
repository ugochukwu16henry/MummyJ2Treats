"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeleteMyAccountSection } from "../_components/DeleteMyAccountSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type RiderProfile = {
  id: string;
  phone: string | null;
  state: string;
  cities: string[];
  transport_type: string | null;
  is_available: boolean;
  current_latitude: number | null;
  current_longitude: number | null;
  location_updated_at: string | null;
};

export default function RiderDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`${API_BASE}/riders/me`, { credentials: "include" });
        if (res.status === 401) { router.push("/auth/login"); return; }
        if (res.ok) {
          const data = await res.json();
          if (data.id && !cancelled) {
            setProfile({
              id: data.id,
              phone: data.phone ?? null,
              state: data.state ?? "",
              cities: Array.isArray(data.cities) ? data.cities : [],
              transport_type: data.transport_type ?? null,
              is_available: data.is_available !== false,
              current_latitude: data.current_latitude != null ? Number(data.current_latitude) : null,
              current_longitude: data.current_longitude != null ? Number(data.current_longitude) : null,
              location_updated_at: data.location_updated_at ?? null,
            });
          } else if (!cancelled) {
            setProfile(null);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [router]);

  function updateLocation() {
    if (!navigator.geolocation) {
      setMessage("Geolocation not supported.");
      return;
    }
    setUpdatingLocation(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`${API_BASE}/riders/me/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
          });
          if (res.ok) {
            setMessage("Location updated.");
            const updated = await fetch(`${API_BASE}/riders/me`, { credentials: "include" }).then((r) => r.json());
            setProfile((p) => p ? { ...p, current_latitude: pos.coords.latitude, current_longitude: pos.coords.longitude, location_updated_at: updated.location_updated_at ?? new Date().toISOString() } : null);
          }
        } finally {
          setUpdatingLocation(false);
        }
      },
      () => {
        setMessage("Could not get location.");
        setUpdatingLocation(false);
      },
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8">
        <div className="max-w-2xl mx-auto text-center py-20 text-zinc-500">Loading…</div>
      </main>
    );
  }

  // Editable profile form state
  const [editForm, setEditForm] = useState<{
    phone: string;
    state: string;
    cities: string;
    transport_type: string;
    is_available: boolean;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<string | null>(null);

  // Populate edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        phone: profile.phone ?? "",
        state: profile.state ?? "",
        cities: profile.cities.join(", "),
        transport_type: profile.transport_type ?? "",
        is_available: profile.is_available,
      });
    }
  }, [profile]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    setEditMsg(null);
    try {
      const res = await fetch(`${API_BASE}/riders/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          phone: editForm.phone,
          state: editForm.state,
          cities: editForm.cities.split(",").map(s => s.trim()).filter(Boolean),
          transportType: editForm.transport_type,
          isAvailable: editForm.is_available,
        }),
      });
      if (res.ok) {
        setEditMsg("Profile updated.");
        const updated = await res.json();
        setProfile((p) => p ? {
          ...p,
          phone: updated.phone ?? "",
          state: updated.state ?? "",
          cities: Array.isArray(updated.cities) ? updated.cities : [],
          transport_type: updated.transport_type ?? "",
          is_available: updated.is_available !== false,
        } : null);
      } else {
        const body = await res.json().catch(() => ({}));
        setEditMsg(body.message ?? "Failed to update profile");
      }
    } catch {
      setEditMsg("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 flex flex-col">
      <div className="max-w-2xl mx-auto space-y-6 flex-1 w-full">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rider Dashboard</h1>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:underline">← Back</Link>
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
                } catch {}
                document.cookie = "access_token=; path=/; max-age=0";
                router.push("/auth/login");
              }}
              className="px-3 py-1 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            >
              Logout
            </button>
          </div>
        </header>
        {!profile ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <p className="font-medium text-amber-800">No rider profile yet.</p>
            <p className="text-amber-700 mt-1">Register as a rider with the API: POST /riders/register with body: state, phone, cities, transportType.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <form className="space-y-3" onSubmit={handleProfileSave}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Phone</label>
                  <input type="tel" className="w-full px-3 py-2 rounded border" value={editForm?.phone ?? ""} onChange={e => setEditForm(f => f && { ...f, phone: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">State</label>
                  <input type="text" className="w-full px-3 py-2 rounded border" value={editForm?.state ?? ""} onChange={e => setEditForm(f => f && { ...f, state: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Cities (comma separated)</label>
                  <input type="text" className="w-full px-3 py-2 rounded border" value={editForm?.cities ?? ""} onChange={e => setEditForm(f => f && { ...f, cities: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Transport Type</label>
                  <select className="w-full px-3 py-2 rounded border" value={editForm?.transport_type ?? ""} onChange={e => setEditForm(f => f && { ...f, transport_type: e.target.value })}>
                    <option value="">Select…</option>
                    <option value="bike">Bike</option>
                    <option value="car">Car</option>
                    <option value="motorcycle">Motorcycle</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="is_available" checked={editForm?.is_available ?? false} onChange={e => setEditForm(f => f && { ...f, is_available: e.target.checked })} />
                  <label htmlFor="is_available" className="text-xs">Available for delivery</label>
                </div>
              </div>
              <button type="submit" className="w-full bg-primary text-white py-2 rounded font-semibold mt-2 disabled:opacity-60" disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
              {editMsg && <p className="text-xs text-green-700 mt-1">{editMsg}</p>}
            </form>
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-zinc-600">State: <strong>{profile.state}</strong> · {profile.is_available ? "Available" : "Unavailable"}</p>
              {message && <p className="text-sm text-green-700">{message}</p>}
              <button type="button" onClick={updateLocation} disabled={updatingLocation} className="w-full bg-primary text-white py-2 rounded-md font-medium disabled:opacity-60 mt-2">
                {updatingLocation ? "Updating…" : "Update my location"}
              </button>
              <p className="text-xs text-zinc-500 mt-1">Vendors and admin can see your live location when you update it.</p>
              {profile.current_latitude != null && profile.current_longitude != null && (
                <p className="text-xs text-zinc-600 mt-2">Last: {profile.current_latitude.toFixed(5)}, {profile.current_longitude.toFixed(5)}</p>
              )}
            </div>
          </div>
        )}
        <DeleteMyAccountSection />
      </div>
      <footer className="mt-8 text-center text-xs text-zinc-500">
        Built by{" "}
        <a
          href="https://henry-ugochukwu-porfolio.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Henry M. Ugochukwu
        </a>
      </footer>
    </main>
  );
}
