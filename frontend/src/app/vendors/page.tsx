const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function fetchVendors() {
  try {
    const res = await fetch(`${API_BASE}/vendors`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function VendorsPage() {
  const vendors = await fetchVendors();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">All Vendors</h1>
            <p className="text-sm text-zinc-600 mt-0.5">
              Browse all verified vendors and visit their stores.
            </p>
          </div>
        </header>

        {vendors.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
            No vendors are live yet. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {vendors.map((v: any) => (
              <a
                key={v.id}
                href={v.slug ? `/vendor/${v.slug}` : "#"}
                className="rounded-2xl bg-white shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="w-12 h-12 rounded-full bg-zinc-100 mb-3 flex items-center justify-center text-lg font-bold text-primary">
                    {(v.business_name || "V").slice(0, 1)}
                  </div>
                  <h2 className="font-semibold text-zinc-900 mb-1">
                    {v.business_name ?? "Vendor"}
                  </h2>
                  {v.description && (
                    <p className="text-xs text-zinc-600 line-clamp-2">{v.description}</p>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                  <span>{v.is_verified ? "Verified" : "Pending approval"}</span>
                  <span className="text-primary font-medium">
                    View store →
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

