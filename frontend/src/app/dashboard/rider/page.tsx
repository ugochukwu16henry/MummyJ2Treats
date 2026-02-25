"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Rider Dashboard</h1>
          <Link href="/dashboard" className="text-sm text-zinc-600 hover:underline">← Back</Link>
        </header>
        {!profile ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <p className="font-medium text-amber-800">No rider profile yet.</p>
            <p className="text-amber-700 mt-1">Register as a rider with the API: POST /riders/register with body: state, phone, cities, transportType.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <p className="text-sm text-zinc-600">State: <strong>{profile.state}</strong> · {profile.is_available ? "Available" : "Unavailable"}</p>
            {message && <p className="text-sm text-green-700">{message}</p>}
            <div>
              <button type="button" onClick={updateLocation} disabled={updatingLocation} className="w-full bg-primary text-white py-2 rounded-md font-medium disabled:opacity-60">
                {updatingLocation ? "Updating…" : "Update my location"}
              </button>
              <p className="text-xs text-zinc-500 mt-1">Vendors and admin can see your live location when you update it.</p>
              {profile.current_latitude != null && profile.current_longitude != null && (
                <p className="text-xs text-zinc-600 mt-2">Last: {profile.current_latitude.toFixed(5)}, {profile.current_longitude.toFixed(5)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
