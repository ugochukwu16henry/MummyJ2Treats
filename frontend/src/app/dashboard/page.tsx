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

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 space-y-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-600">
          You are logged in{role ? ` as ${role}` : ""}.
        </p>
        {role === "vendor" && (
          <Link
            href="/dashboard/vendor"
            className="inline-block text-primary font-medium hover:underline"
          >
            Go to Vendor Dashboard →
          </Link>
        )}
        {!role && (
          <p className="text-xs text-zinc-500">
            (Load profile to see role-based links.)
          </p>
        )}
      </div>
    </main>
  );
}
