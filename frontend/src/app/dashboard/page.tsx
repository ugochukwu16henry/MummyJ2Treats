import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access_token");

  if (!access) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-md p-6 space-y-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-zinc-600">
          You are logged in. This page is only accessible when an{" "}
          <code className="px-1 py-0.5 bg-zinc-100 rounded">
            access_token
          </code>{" "}
          cookie is present.
        </p>
        <p className="text-xs text-zinc-500">
          (Next steps: load user profile and role from the backend and show
          role-based sections here.)
        </p>
      </div>
    </main>
  );
}

