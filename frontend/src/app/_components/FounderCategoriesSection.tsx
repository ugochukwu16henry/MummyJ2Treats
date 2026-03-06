type Cat = { id: string; name: string; slug: string; description?: string | null; productCount: number };

export function FounderCategoriesSection({ categories }: { categories: Cat[] }) {
  if (categories.length === 0) return null;
  return (
    <section id="categories" className="py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: "var(--foreground)" }}>
        Shop by category
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {categories.map((cat) => (
          <a
            key={cat.id}
            href={`/categories/${encodeURIComponent(cat.slug)}`}
            className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-lg transition-shadow flex flex-col border border-zinc-100 dark:border-zinc-800"
          >
            <div
              className="relative h-32 w-full flex items-center justify-center"
              style={{ backgroundColor: "var(--secondary)" }}
            >
              <span className="text-4xl text-white/90 font-bold">{cat.name.charAt(0)}</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="text-sm font-semibold text-white">{cat.name}</div>
                <div className="text-xs text-white/80">
                  {cat.productCount === 1 ? "1 product" : `${cat.productCount} products`}
                </div>
              </div>
            </div>
            <div className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>
              {cat.description ?? `Fresh ${cat.name.toLowerCase()} from MummyJ2Treats.`}
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
