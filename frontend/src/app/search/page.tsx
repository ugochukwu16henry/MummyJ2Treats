"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteHeader } from "../_components/SiteHeader";
import { SiteFooter } from "../_components/SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ProductSummary = { id: string; name: string; slug: string; description?: string | null; price: number };

export default function SearchPage() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (term: string) => {
    if (!term.trim() || term.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/products/search?q=${encodeURIComponent(term.trim())}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      const json = await res.json();
      setResults(Array.isArray(json) ? json : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setQuery(q);
    runSearch(q);
  }, [q, runSearch]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = (e.currentTarget.querySelector('input[name="q"]') as HTMLInputElement)?.value?.trim() ?? "";
    if (term) window.location.href = `/search?q=${encodeURIComponent(term)}`;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl mx-auto w-full" style={{ background: "var(--background)" }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
          Search
        </h1>
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <label htmlFor="search-q" className="sr-only">Search products</label>
            <input
              id="search-q"
              name="q"
              type="search"
              placeholder="Search by product name…"
              defaultValue={query}
              className="flex-1 border border-zinc-300 dark:border-zinc-600 rounded-lg px-4 py-2.5 text-sm"
              style={{ background: "var(--background)", color: "var(--foreground)" }}
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-lg font-semibold text-white text-sm"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Search
            </button>
          </div>
        </form>

        {loading && <p className="opacity-70 text-sm" style={{ color: "var(--foreground)" }}>Searching…</p>}
        {!loading && query.trim().length < 2 && (
          <p className="opacity-70 text-sm" style={{ color: "var(--foreground)" }}>Enter at least 2 characters to search.</p>
        )}
        {!loading && query.trim().length >= 2 && results.length === 0 && (
          <p className="opacity-70 text-sm" style={{ color: "var(--foreground)" }}>No products found. Try a different search or <Link href="/categories" className="font-medium underline" style={{ color: "var(--primary)" }}>browse categories</Link>.</p>
        )}
        {!loading && results.length > 0 && (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {results.map((p) => (
              <Link
                key={p.id}
                href={`/shop/${encodeURIComponent(p.slug)}`}
                className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                style={{ background: "var(--background)" }}
              >
                <span className="font-semibold line-clamp-2" style={{ color: "var(--foreground)" }}>{p.name}</span>
                <span className="font-bold text-lg mt-auto" style={{ color: "var(--primary)" }}>₦{Number(p.price).toLocaleString()}</span>
                <span className="text-xs opacity-70" style={{ color: "var(--foreground)" }}>View details →</span>
              </Link>
            ))}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
