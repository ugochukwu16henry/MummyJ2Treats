import Link from "next/link";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  productCount: number;
};

async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/products/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? (json as CategoryItem[]) : [];
  } catch {
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await fetchCategories();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 md:px-8 space-y-6" style={{ background: "var(--background)" }}>
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Shop
          </h1>
          <p className="text-sm sm:text-base max-w-2xl opacity-90" style={{ color: "var(--foreground)" }}>
            Browse by category. All treats are made fresh by MummyJ2Treats.
          </p>
        </header>

        {categories.length === 0 ? (
          <p className="text-sm opacity-80" style={{ color: "var(--foreground)" }}>
            No categories yet. Once products are added, they will appear here.
          </p>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${encodeURIComponent(c.slug)}`}
                className="rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5 flex flex-col justify-between hover:shadow-md transition-shadow"
                style={{ background: "var(--background)" }}
              >
                <div>
                  <div className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
                    {c.name}
                  </div>
                  <div className="text-xs opacity-70" style={{ color: "var(--foreground)" }}>
                    {c.productCount === 1 ? "1 product" : `${c.productCount} products`}
                  </div>
                </div>
                <div className="mt-3 text-sm font-medium" style={{ color: "var(--primary)" }}>
                  View products →
                </div>
              </Link>
            ))}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

