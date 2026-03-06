"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

const registerSchema = z
  .object({
    firstName: z.string().min(2, "Enter your first name"),
    lastName: z.string().min(2, "Enter your last name"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    try {
      setLoading(true);
      const { confirmPassword, ...payload } = parsed.data;
      const res = await fetch(`${API_BASE}/auth/register/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { message?: string }).message ?? "Registration failed");
        return;
      }
      const body = await res.json().catch(() => null);
      if ((body as { accessToken?: string })?.accessToken) {
        document.cookie = `access_token=${(body as { accessToken: string }).accessToken}; path=/; secure; samesite=Lax`;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error, please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2";
  const labelClass = "block text-sm font-medium mb-1";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-12 px-4" style={{ background: "var(--background)" }}>
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-lg" style={{ background: "var(--background)" }}>
          <h1 className="text-2xl font-bold text-center mb-6" style={{ color: "var(--foreground)" }}>
            Create your account
          </h1>
          {error && (
            <div className="mb-4 text-sm px-3 py-2 rounded-lg" style={{ backgroundColor: "var(--error)", color: "white" }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="register-firstName" className={labelClass} style={{ color: "var(--foreground)" }}>First name</label>
                <input id="register-firstName" name="firstName" type="text" autoComplete="given-name" className={inputClass} style={{ background: "var(--background)", color: "var(--foreground)" }} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required />
              </div>
              <div className="flex-1">
                <label htmlFor="register-lastName" className={labelClass} style={{ color: "var(--foreground)" }}>Last name</label>
                <input id="register-lastName" name="lastName" type="text" autoComplete="family-name" className={inputClass} style={{ background: "var(--background)", color: "var(--foreground)" }} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required />
              </div>
            </div>
            <div>
              <label htmlFor="register-email" className={labelClass} style={{ color: "var(--foreground)" }}>Email</label>
              <input id="register-email" name="email" type="email" autoComplete="email" className={inputClass} style={{ background: "var(--background)", color: "var(--foreground)" }} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label htmlFor="register-phone" className={labelClass} style={{ color: "var(--foreground)" }}>Phone (optional)</label>
              <input id="register-phone" name="phone" type="tel" autoComplete="tel" className={inputClass} style={{ background: "var(--background)", color: "var(--foreground)" }} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label htmlFor="register-password" className={labelClass} style={{ color: "var(--foreground)" }}>Password</label>
              <input id="register-password" name="password" type="password" autoComplete="new-password" className={inputClass} style={{ background: "var(--background)", color: "var(--foreground)" }} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
            </div>
            <div>
              <label htmlFor="register-confirmPassword" className={labelClass} style={{ color: "var(--foreground)" }}>Confirm password</label>
              <input id="register-confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" className={inputClass} style={{ background: "var(--background)", color: "var(--foreground)" }} value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60 transition-opacity" style={{ backgroundColor: "var(--primary)" }}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="text-sm text-center mt-4" style={{ color: "var(--foreground)" }}>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-medium" style={{ color: "var(--primary)" }}>
              Login
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

