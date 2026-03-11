"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "../../../lib/apiBase";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
      if (!res.ok || !body.token) {
        if (res.status === 404) {
          setError(`Admin API URL is incorrect. Check NEXT_PUBLIC_API_URL. Tried: ${API_BASE}/auth/login`);
          return;
        }
        if (res.status !== 401 && body.message) {
          setError(body.message);
          return;
        }
        setError("Invalid email or password.");
        return;
      }
      // Store token in localStorage and cookie for middleware
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_token", body.token);
        document.cookie = `admin_token=${body.token}; path=/; max-age=43200; sameSite=Lax`;
      }
      router.push("/admin/orders");
    } catch {
      setError("Cannot reach admin API. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-50">
      <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-pink-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">MummyJ2 Dashboard</h1>
          <p className="text-gray-500 mt-2">Welcome back! Please sign in.</p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {error}
          </p>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold hover:bg-pink-600 transition-all shadow-lg disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

