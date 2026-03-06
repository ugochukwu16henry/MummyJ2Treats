"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

type ProductSummary = { id: string; name: string; slug: string; description?: string | null; price: number };

type SortOption = "name" | "price-asc" | "price-desc";

export function CategoryProductGrid({ products }: { products: ProductSummary[] }) {
  const [sort, setSort] = useState<SortOption>("name");
  const sorted = useMemo(() => {
    const list = [...products];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-asc") list.sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === "price-desc") list.sort((a, b) => Number(b.price) - Number(a.price));
    return list;
  }, [products, sort]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <span className="text-sm opacity-80" style={{ color: "var(--foreground)" }}>
          {products.length} product{products.length !== 1 ? "s" : ""}
        </span>
        <label className="flex items-center gap-2 text-sm" style={{ color: "var(--foreground)" }}>
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="border border-zinc-300 dark:border-zinc-600 rounded-lg px-2 py-1.5 text-sm"
            style={{ background: "var(--background)", color: "var(--foreground)" }}
          >
            <option value="name">Name A–Z</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {sorted.map((p) => (
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
    </>
  );
}
