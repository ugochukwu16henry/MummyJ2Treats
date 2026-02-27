const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type CategoryProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number | null;
  is_active: boolean;
  vendor_id: string;
  vendor_name: string;
  vendor_slug: string;
  vendor_logo_url: string | null;
  category?: string | null;
  size_label?: string | null;
  ingredients?: string | null;
  nutritional_info?: string | null;
};

async function fetchCategoryProducts(categoryName: string): Promise<CategoryProduct[]> {
  try {
    const params = new URLSearchParams();
    params.set("category", categoryName);
    params.set("limit", "60");
    const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    const rows = (json.data ?? []) as CategoryProduct[];
    return rows;
  } catch {
    return [];
  }
}

export default async function CategoryProductsPage({
  params,
}: {
  params: { slug: string };
}) {
  const decodedSlug = decodeURIComponent(params.slug);
  const rawName = decodedSlug.replace(/-/g, " ").trim();
  const categoryName =
    rawName.length === 0
      ? "Category"
      : rawName
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

  const products = await fetchCategoryProducts(categoryName);

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black">
      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 md:px-8 lg:px-12 space-y-6">
        <header className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
            {categoryName}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 max-w-2xl">
            Products from the founder’s store and verified vendors in this category. Tap a card to
            visit the vendor store and complete your order.
          </p>
        </header>

        {products.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No products found in this category yet. Check back soon.
          </p>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map((p) => {
              const inStock = (p.stock ?? 0) > 0 && p.is_active;
              const linkHref = p.vendor_slug
                ? `/vendor/${p.vendor_slug}#${encodeURIComponent(p.slug)}`
                : "/";
              return (
                <a
                  key={p.id}
                  href={linkHref}
                  className="rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                >
                  <div className="text-xs text-zinc-500">
                    {p.vendor_name ?? "Vendor"}{" "}
                    {p.category && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px]">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-zinc-900 dark:text-white line-clamp-2">
                    {p.name}
                  </div>
                  <div className="text-sm font-bold text-primary">
                    ₦{Number(p.price).toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {p.size_label ? `Size: ${p.size_label}` : null}
                  </div>
                  <div className="text-xs">
                    {inStock ? (
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        In stock
                      </span>
                    ) : (
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        Out of stock — check later
                      </span>
                    )}
                  </div>
                  {p.ingredients && (
                    <div className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-300 line-clamp-3">
                      <span className="font-semibold">What’s inside: </span>
                      {p.ingredients}
                    </div>
                  )}
                  {p.nutritional_info && (
                    <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-3">
                      <span className="font-semibold">Nutritional info: </span>
                      {p.nutritional_info}
                    </div>
                  )}
                </a>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}

