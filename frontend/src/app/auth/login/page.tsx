"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(parsed.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Login failed");
        return;
      }

      // Mirror backend auth cookie onto the frontend domain so /dashboard can see it
      const body = await res.json().catch(() => null);
      if (body?.accessToken) {
        document.cookie = `access_token=${body.accessToken}; path=/; secure; samesite=Lax`;
      }

      router.push("/dashboard");
    } catch (err) {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-8 shadow-lg" style={{ background: "var(--background)" }}>
          <h1 className="text-2xl font-bold text-center mb-6" style={{ color: "var(--foreground)" }}>
            Login to MummyJ2Treats
          </h1>
          {error && (
            <div className="mb-4 text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--error)", color: "white" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                className="w-full border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ background: "var(--background)", color: "var(--foreground)" }}
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="w-full border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ background: "var(--background)", color: "var(--foreground)" }}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 transition-opacity"
              style={{ backgroundColor: "var(--primary)" }}
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>
          <p className="text-sm text-center mt-4" style={{ color: "var(--foreground)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="font-medium" style={{ color: "var(--primary)" }}>
              Register
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

