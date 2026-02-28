"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { DeleteMyAccountSection } from "../_components/DeleteMyAccountSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const nav = [
  { href: "/dashboard/vendor", label: "Overview" },
  { href: "/dashboard/vendor/products", label: "Products" },
  { href: "/dashboard/vendor/blog", label: "Blog" },
  { href: "/dashboard/vendor/location", label: "Location & delivery" },
] as const;

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [unauth, setUnauth] = useState(false);

  useEffect(() => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    const token = cookie?.replace(/^access_token=/, "").trim();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          setUnauth(true);
          return;
        }
        return res.json();
      })
      .then((me: { role?: string } | undefined) => {
        const role = me?.role ?? "";
        if (role !== "vendor" && role !== "admin") {
          router.push("/dashboard");
          return;
        }
        setReady(true);
      })
      .catch(() => setUnauth(true));
  }, [router]);

  useEffect(() => {
    if (unauth) router.push("/auth/login");
  }, [unauth, router]);

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {}
    document.cookie = "access_token=; path=/; max-age=0";
    router.push("/auth/login");
  }

  if (!ready && !unauth) {
    return (
      <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
        <aside className="w-full md:w-56 shrink-0 bg-white border-b md:border-b-0 md:border-r border-zinc-200 p-4">
          <p className="text-sm font-medium text-zinc-500">Vendor</p>
          <nav className="mt-2 space-y-1">
            {nav.map((item) => (
              <div key={item.href} className="px-3 py-2 rounded-lg text-sm text-zinc-400">
                {item.label}
              </div>
            ))}
          </nav>
        </aside>
        <main className="flex-1 flex items-center justify-center p-8">
          <p className="text-zinc-500">Checking access…</p>
        </main>
      </div>
    );
  }

  if (unauth) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-56 shrink-0 bg-white border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col">
        <div className="p-4 border-b border-zinc-200">
          <h1 className="font-semibold text-zinc-900">Vendor</h1>
          <p className="text-xs text-zinc-500 mt-0.5">Dashboard</p>
        </div>
        <nav className="p-2 flex-1">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-zinc-200 space-y-2">
          <Link
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100"
          >
            ← Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Logout
          </button>
          <div className="pt-2 border-t border-zinc-100">
            <DeleteMyAccountSection />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto px-4 py-6 md:px-6 lg:px-8">
        <div className="min-h-full flex flex-col">
          <div className="flex-1">{children}</div>
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
        </div>
      </main>
    </div>
  );
}
