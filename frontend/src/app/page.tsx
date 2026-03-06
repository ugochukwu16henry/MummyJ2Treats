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
          className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 sm:gap-8 px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20 max-w-7xl mx-auto w-full"
          style={{ background: "var(--background)" }}
        >
          <div className="flex-1 flex flex-col gap-3 sm:gap-5 w-full min-w-0">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight"
              style={{ color: "var(--foreground)" }}
            >
              Homemade treats, delivered to you
            </h1>
            <p className="text-sm sm:text-base md:text-lg opacity-90" style={{ color: "var(--foreground)" }}>
              Fresh baked and handcrafted from our kitchen to yours. One store, one passion for quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1 sm:mt-2">
              <Link
                href="#featured"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 sm:px-6 sm:py-3 text-base sm:text-lg font-semibold text-white shadow hover:opacity-95 transition-opacity w-full sm:w-auto"
                style={{ backgroundColor: "var(--primary)" }}
              >
                Shop now
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 sm:px-6 sm:py-3 text-base sm:text-lg font-semibold border-2 transition-colors w-full sm:w-auto"
                style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
              >
                Browse categories
              </Link>
            </div>
          </div>
          <div className="flex-1 flex justify-center w-full min-w-0">
            <Image
              src="/mummyj2banner.png"
              alt="MummyJ2Treats"
              width={560}
              height={360}
              className="rounded-2xl shadow-xl object-cover w-full max-w-sm sm:max-w-md md:max-w-lg"
            />
          </div>
        </section>

        {/* Trust strip: delivery & freshness */}
        <section className="border-y border-zinc-200 dark:border-zinc-800 py-4 px-4 sm:px-6 lg:px-8" style={{ background: "var(--background)" }}>
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm">
            <span className="flex items-center gap-2 opacity-90" style={{ color: "var(--foreground)" }}>
              <span className="material-icons text-lg" style={{ color: "var(--primary)" }}>local_shipping</span>
              Delivery in Lagos
            </span>
            <span className="flex items-center gap-2 opacity-90" style={{ color: "var(--foreground)" }}>
              <span className="material-icons text-lg" style={{ color: "var(--primary)" }}>favorite</span>
              Fresh daily
            </span>
            <span className="flex items-center gap-2 opacity-90" style={{ color: "var(--foreground)" }}>
              <span className="material-icons text-lg" style={{ color: "var(--primary)" }}>verified</span>
              Handcrafted with care
            </span>
          </div>
        </section>

        <FounderCategoriesSection categories={categories} />

        {/* Featured products */}
        <section id="featured" className="py-8 sm:py-10 lg:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: "var(--foreground)" }}>
            Featured treats
          </h2>
          {featured.length === 0 ? (
            <p className="opacity-80 text-sm" style={{ color: "var(--foreground)" }}>
              New treats are on the way. Browse categories or check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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

        {/* Newsletter */}
        <section className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto w-full text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
            Get the best treats in your inbox
          </h2>
          <p className="text-sm opacity-90 mb-4" style={{ color: "var(--foreground)" }}>
            New flavours, offers and delivery updates.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-2 justify-center"
            action={async (formData: FormData) => {
              "use server";
              const email = String(formData.get("email") ?? "").trim();
              if (!email) return;
              try {
                await fetch(`${API_BASE}/newsletter/subscribe`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
              } catch {
                // ignore
              }
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">Email</label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              placeholder="Your email"
              className="px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-600 w-full sm:w-64 text-sm"
              style={{ background: "var(--background)", color: "var(--foreground)" }}
              required
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg font-semibold text-white text-sm"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Subscribe
            </button>
          </form>
        </section>

        {/* How it works */}
        <section className="py-8 sm:py-10 lg:py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center" style={{ color: "var(--foreground)" }}>
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 md:gap-12 justify-center items-center">
            {[
              { icon: "🛒", label: "Browse", desc: "Choose your favourites" },
              { icon: "📦", label: "Order", desc: "We prepare them fresh" },
              { icon: "🚚", label: "Delivered", desc: "Straight to your door" },
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
