import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CategoryRow = {
  name: string;
  product_count: number | string;
};

async function fetchCategories(): Promise<CategoryRow[]> {
  try {
    const res = await fetch(`${API_BASE}/products/categories`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = (json.data ?? []) as CategoryRow[];
    return rows;
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black">
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12 space-y-6">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            Categories
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl">
            Browse all categories across the founder’s store and verified vendors. Pick a
            category to see products, prices, sizes, and what goes into each treat.
          </p>
        </header>

        {categories.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No categories yet. Once products are added, they will be grouped here.
          </p>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((c) => {
              const count = Number((c.product_count as any) ?? 0) || 0;
              const slug = encodeURIComponent(
                String(c.name)
                  .toLowerCase()
                  .trim()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, ""),
              );
              return (
                <Link
                  key={c.name}
                  href={`/categories/${slug}`}
                  className="rounded-2xl shadow-sm bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white mb-1">
                      {c.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {count === 1 ? "1 product" : `${count} products`}
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-primary font-medium">
                    View products →
                  </div>
                </Link>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

