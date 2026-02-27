"use client";

import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function DashboardLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore network errors
    }
    document.cookie = "access_token=; path=/; max-age=0";
    router.push("/auth/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="px-3 py-1.5 rounded-md border border-zinc-300 text-xs sm:text-sm text-zinc-700 hover:bg-zinc-100"
    >
      Logout
    </button>
  );
}

