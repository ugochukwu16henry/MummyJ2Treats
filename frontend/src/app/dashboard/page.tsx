import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardLogoutButton } from "./_components/DashboardLogoutButton";
import { DeleteMyAccountSection } from "./_components/DeleteMyAccountSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token");

  if (!access) {
    redirect("/auth/login");
  }

  let role: string | null = null;
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Cookie: `access_token=${access.value}` },
    });
    if (res.ok) {
      const user = (await res.json()) as { role?: string };
      role = user.role ?? null;
    }
  } catch {
    // ignore
  }

  if (role === "admin") {
    redirect("/dashboard/admin");
  }
  if (role === "vendor") {
    redirect("/dashboard/vendor");
  }
  if (role === "rider") {
    redirect("/dashboard/rider");
  }

  let referralCode: string | null = null;
  let loyaltyPoints: number | null = null;
  if (role === "customer") {
    try {
      const [refRes, loyaltyRes] = await Promise.all([
        fetch(`${API_BASE}/moat/referral/me`, { headers: { Cookie: `access_token=${access.value}` } }),
        fetch(`${API_BASE}/moat/loyalty/me`, { headers: { Cookie: `access_token=${access.value}` } }),
      ]);
      if (refRes.ok) {
        const ref = (await refRes.json()) as { code?: string };
        referralCode = ref.code ?? null;
      }
      if (loyaltyRes.ok) {
        const lb = (await loyaltyRes.json()) as { points?: number };
        loyaltyPoints = lb.points ?? null;
      }
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col" style={{ background: "var(--background)" }}>
      <div className="max-w-3xl mx-auto space-y-4 flex-1 w-full min-w-0">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md p-4 sm:p-6 space-y-4" style={{ background: "var(--background)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Dashboard</h1>
              <p className="text-sm opacity-80" style={{ color: "var(--foreground)" }}>
                You are logged in{role ? ` as ${role}` : ""}.
              </p>
            </div>
            <DashboardLogoutButton />
          </div>
          {role === "customer" && (
            <Link
              href="/dashboard/orders"
              className="inline-block font-medium hover:underline"
              style={{ color: "var(--primary)" }}
            >
              My orders →
            </Link>
          )}
          {role === "rider" && (
            <Link href="/dashboard/rider" className="inline-block font-medium hover:underline" style={{ color: "var(--primary)" }}>
              Go to Rider Dashboard →
            </Link>
          )}
          {!role && (
            <p className="text-xs opacity-70" style={{ color: "var(--foreground)" }}>
              (Load profile to see role-based links.)
            </p>
          )}
        </div>
        {role === "customer" && (
          <DeleteMyAccountSection />
        )}
        {role === "customer" && (referralCode != null || loyaltyPoints != null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {referralCode != null && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md p-4" style={{ background: "var(--background)" }}>
                <h2 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>Your referral code</h2>
                <p className="font-mono text-lg px-3 py-2 rounded bg-zinc-100 dark:bg-zinc-800" style={{ color: "var(--foreground)" }}>{referralCode}</p>
                <p className="text-xs opacity-70 mt-1" style={{ color: "var(--foreground)" }}>Share it; when friends order, you earn 50 points.</p>
              </div>
            )}
            {loyaltyPoints != null && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md p-4" style={{ background: "var(--background)" }}>
                <h2 className="font-semibold mb-2" style={{ color: "var(--foreground)" }}>Loyalty points</h2>
                <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{loyaltyPoints}</p>
                <p className="text-xs opacity-70 mt-1" style={{ color: "var(--foreground)" }}>Earn 1 point per ₦100 spent.</p>
              </div>
            )}
          </div>
        )}
      </div>
      <footer className="mt-8 text-center text-xs opacity-70" style={{ color: "var(--foreground)" }}>
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
