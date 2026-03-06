import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
};

async function fetchCategoryProducts(categorySlug: string): Promise<ProductSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/products/by-category/${encodeURIComponent(categorySlug)}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? (json as ProductSummary[]) : [];
  } catch {
    return [];
  }
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function CategoryProductsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const categorySlug = decodeURIComponent(slug);
  const categoryName = slugToTitle(categorySlug) || "Category";
  const products = await fetchCategoryProducts(categorySlug);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-6" style={{ background: "var(--background)" }}>
        <nav className="text-sm opacity-80" style={{ color: "var(--foreground)" }}>
          <Link href="/">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/categories">Shop</Link>
          <span className="mx-2">/</span>
          <span>{categoryName}</span>
        </nav>

        <header>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            {categoryName}
          </h1>
          <p className="text-sm sm:text-base max-w-2xl opacity-90" style={{ color: "var(--foreground)" }}>
            Handcrafted {categoryName.toLowerCase()}—made to order.
          </p>
        </header>

        {products.length === 0 ? (
          <p className="text-sm opacity-80" style={{ color: "var(--foreground)" }}>
            No products in this category yet. Check back soon.
          </p>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/shop/${encodeURIComponent(p.slug)}`}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                style={{ background: "var(--background)" }}
              >
                <div className="font-semibold line-clamp-2" style={{ color: "var(--foreground)" }}>
                  {p.name}
                </div>
                <div className="font-bold text-lg mt-auto" style={{ color: "var(--primary)" }}>
                  ₦{Number(p.price).toLocaleString()}
                </div>
                <span className="text-xs opacity-70" style={{ color: "var(--foreground)" }}>
                  View details →
                </span>
              </Link>
            ))}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
