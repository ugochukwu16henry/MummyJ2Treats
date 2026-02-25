import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-zinc-600">
            You are logged in{role ? ` as ${role}` : ""}.
          </p>
          {role === "customer" && (
            <Link
              href="/dashboard/orders"
              className="inline-block text-primary font-medium hover:underline mr-4"
            >
              My orders →
            </Link>
          )}
          {role === "vendor" && (
            <Link href="/dashboard/vendor" className="inline-block text-primary font-medium hover:underline">
              Go to Vendor Dashboard →
            </Link>
          )}
          {role === "rider" && (
            <Link href="/dashboard/rider" className="inline-block text-primary font-medium hover:underline">
              Go to Rider Dashboard →
            </Link>
          )}
          {!role && (
            <p className="text-xs text-zinc-500">
              (Load profile to see role-based links.)
            </p>
          )}
        </div>
        {role === "customer" && (referralCode != null || loyaltyPoints != null) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {referralCode != null && (
              <div className="bg-white rounded-2xl shadow-md p-4">
                <h2 className="font-semibold text-zinc-800 mb-2">Your referral code</h2>
                <p className="font-mono text-lg bg-zinc-100 px-3 py-2 rounded">{referralCode}</p>
                <p className="text-xs text-zinc-500 mt-1">Share it; when friends order, you earn 50 points.</p>
              </div>
            )}
            {loyaltyPoints != null && (
              <div className="bg-white rounded-2xl shadow-md p-4">
                <h2 className="font-semibold text-zinc-800 mb-2">Loyalty points</h2>
                <p className="text-2xl font-bold text-primary">{loyaltyPoints}</p>
                <p className="text-xs text-zinc-500 mt-1">Earn 1 point per ₦100 spent.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
