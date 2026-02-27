"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const nav = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/products", label: "Products" },
  { href: "/dashboard/admin/vendors", label: "Vendors" },
  { href: "/dashboard/admin/orders", label: "Orders" },
  { href: "/dashboard/admin/support", label: "Support" },
  { href: "/dashboard/admin/delivery-map", label: "Delivery map" },
  { href: "/dashboard/admin/testimonials", label: "Testimonials" },
  { href: "/dashboard/admin/newsletter", label: "Newsletter emails" },
  { href: "/dashboard/admin/blog", label: "Blog moderation" },
] as const;

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [unauth, setUnauth] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [uploadingPic, setUploadingPic] = useState(false);
  useEffect(() => {
    async function fetchProfilePic() {
      try {
        const res = await fetch(`${API_BASE}/admin/me/profile-picture`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setProfilePicUrl(data.url ?? null);
        }
      } catch {}
    }
    fetchProfilePic();
  }, []);
  async function uploadProfilePic(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setUploadingPic(true);
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const res = await fetch(`${API_BASE}/admin/me/profile-picture`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setProfilePicUrl(data.url ?? null);
      }
    } finally {
      setUploadingPic(false);
    }
  }

  useEffect(() => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    const token = cookie?.replace(/^access_token=/, "").trim();
    if (!token) {
      router.push("/auth/login");
      return;
    }
    const headers: HeadersInit = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/auth/me`, { credentials: "include", headers })
      .then((res) => {
        if (!res.ok) {
          setUnauth(true);
          return;
        }
        return res.json();
      })
      .then((me: { role?: string } | undefined) => {
        if (me?.role !== "admin") {
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
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Checking access…</p>
      </div>
    );
  }

  if (unauth) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <p className="text-zinc-500">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-56 shrink-0 bg-white border-b md:border-b-0 md:border-r border-zinc-200 flex flex-col">
        <div className="p-4 border-b border-zinc-200 flex flex-col items-center">
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover border mb-2" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 mb-2">No photo</div>
          )}
          <label className="block text-xs text-primary cursor-pointer mb-2">
            <input type="file" accept="image/*" className="hidden" onChange={uploadProfilePic} disabled={uploadingPic} />
            {uploadingPic ? "Uploading…" : "Add/Change photo"}
          </label>
          <h1 className="font-semibold text-zinc-900">Founder Admin</h1>
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
        <div className="p-2 border-t border-zinc-200">
          <a
            href="/dashboard"
            className="block px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100"
          >
            ← Back to Dashboard
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Logout
          </button>
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
