"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function RiderRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "rider" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Registration failed");
        setLoading(false);
        return;
      }
      router.push("/dashboard/rider");
    } catch {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white shadow-md rounded-2xl p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Rider Sign Up</h1>
        {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input type="text" placeholder="First Name" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="w-full px-4 py-2 rounded border" required />
          <input type="text" placeholder="Last Name" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="w-full px-4 py-2 rounded border" required />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2 rounded border" required />
          <input type="tel" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2 rounded border" required />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-2 rounded border" required />
          <button type="submit" className="w-full bg-primary text-white py-2 rounded font-semibold" disabled={loading}>{loading ? "Signing up..." : "Sign Up"}</button>
        </form>
        <div className="text-center text-sm mt-2">
          Already a rider? <a href="/auth/login" className="text-primary underline">Login</a>
        </div>
      </div>
    </div>
  );
}
