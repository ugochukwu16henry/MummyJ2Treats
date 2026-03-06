import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "./_components/SiteHeader";
import { SiteFooter } from "./_components/SiteFooter";
import { FounderCategoriesSection } from "./_components/FounderCategoriesSection";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ProductSummary = { id: string; name: string; slug: string; description?: string | null; price: number };
type CategoryItem = { id: string; name: string; slug: string; description?: string | null; productCount: number };

async function fetchFeatured() {
  try {
    const res = await fetch(`${API_BASE}/products/featured`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return (Array.isArray(json) ? json : []) as ProductSummary[];
  } catch {
    return [];
  }
}

async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/products/categories`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return (Array.isArray(json) ? json : []) as CategoryItem[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const [featured, categories] = await Promise.all([fetchFeatured(), fetchCategories()]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section
          className="flex flex-col-reverse md:flex-row items-center justify-between gap-8 px-4 sm:px-6 py-12 sm:py-16 md:py-20 max-w-7xl mx-auto"
          style={{ background: "var(--background)" }}
        >
          <div className="flex-1 flex flex-col gap-4 sm:gap-5">
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              Homemade treats, delivered to you
            </h1>
            <p className="text-base sm:text-lg opacity-90" style={{ color: "var(--foreground)" }}>
              Order fresh, trusted homemade goodies from MummyJ2Treats—one store, one passion for quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <Link
                href="#featured"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-lg font-semibold text-white shadow hover:opacity-95 transition-opacity"
                style={{ backgroundColor: "var(--primary)" }}
              >
                Shop now
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-lg font-semibold border-2 transition-colors"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                Browse categories
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center">
            <Image
              src="/mummyj2banner.png"
              alt="MummyJ2Treats"
              width={560}
              height={360}
              className="rounded-2xl shadow-xl object-cover w-full max-w-md"
            />
          </div>
        </section>

        <FounderCategoriesSection categories={categories} />

        {/* Featured products */}
        <section id="featured" className="py-10 sm:py-14 px-4 sm:px-6 max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--foreground)" }}>
            Featured treats
          </h2>
          {featured.length === 0 ? (
            <p className="opacity-70" style={{ color: "var(--foreground)" }}>
              New treats coming soon. Check back or browse categories.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {featured.map((p) => (
                <Link
                  key={p.id}
                  href={`/shop/${encodeURIComponent(p.slug)}`}
                  className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 p-4 flex flex-col gap-2 hover:shadow-lg transition-shadow border border-zinc-100 dark:border-zinc-800"
                >
                  <span className="font-semibold line-clamp-2 text-sm sm:text-base" style={{ color: "var(--foreground)" }}>
                    {p.name}
                  </span>
                  <span className="font-bold text-lg mt-auto" style={{ color: "var(--primary)" }}>
                    ₦{Number(p.price).toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
          {featured.length > 0 && (
            <div className="mt-6 text-center">
              <Link
                href="/categories"
                className="text-sm font-medium hover:underline"
                style={{ color: "var(--primary)" }}
              >
                View all categories →
              </Link>
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="py-10 sm:py-14 px-4 sm:px-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center" style={{ color: "var(--foreground)" }}>
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 justify-center items-center">
            {[
              { icon: "🛒", label: "Browse", desc: "Pick your treats" },
              { icon: "📦", label: "Order", desc: "We prepare fresh" },
              { icon: "🚚", label: "Delivered", desc: "To your door" },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="text-4xl mb-2">{step.icon}</div>
                <span className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>
                  {step.label}
                </span>
                <span className="text-sm opacity-80" style={{ color: "var(--foreground)" }}>
                  {step.desc}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
