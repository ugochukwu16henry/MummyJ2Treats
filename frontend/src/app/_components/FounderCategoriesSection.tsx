const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Cat = { id: string; name: string; slug: string; description?: string | null; image_url?: string | null };

export function FounderCategoriesSection({ categories }: { categories: Cat[] }) {
  if (categories.length === 0) return null;
  return (
    <section id="categories" className="py-8 sm:py-12 px-2 sm:px-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Founder's categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        {categories.map((cat) => {
          const imageSrc = cat.image_url
            ? (cat.image_url.startsWith("/") ? `${API_BASE.replace(/\/$/, "")}${cat.image_url}` : cat.image_url)
            : "/images/categories/parfaits.jpg";
          return (
            <a
              key={cat.id}
              href={`/categories/${encodeURIComponent(cat.slug)}`}
              className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
            >
              <div className="relative h-32 w-full bg-zinc-100 dark:bg-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <div className="text-sm font-semibold text-white">{cat.name}</div>
                  <div className="text-[11px] text-zinc-200 line-clamp-1">{cat.description ?? ""}</div>
                </div>
              </div>
              <div className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                Shop freshly prepared {cat.name.toLowerCase()} directly from the founder's store.
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
