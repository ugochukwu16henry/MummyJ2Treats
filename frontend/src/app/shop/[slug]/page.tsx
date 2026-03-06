"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../_components/SiteHeader";
import { SiteFooter } from "../../_components/SiteFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryName: string;
};

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (res.status === 404) {
          if (!cancelled) setProduct(null);
          return;
        }
        if (!res.ok) {
          if (!cancelled) setProduct(null);
          return;
        }
        const data = (await res.json()) as ProductDetail;
        if (!cancelled) setProduct(data);
      } catch {
        if (!cancelled) setProduct(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function addToCart() {
    if (!product) return;
    setMessage(null);
    setAdding(true);
    try {
      const res = await fetch(`${API_BASE}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      if (res.status === 401) {
        router.push("/auth/login?next=" + encodeURIComponent("/shop/" + slug));
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage((body as { message?: string }).message ?? "Could not add to cart.");
        return;
      }
      setMessage("Added to cart!");
    } catch {
      setMessage("Network error.");
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center py-20">
          <p style={{ color: "var(--foreground)" }}>Loading…</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4">
          <p className="mb-4" style={{ color: "var(--foreground)" }}>
            Product not found.
          </p>
          <Link href="/categories" className="font-medium" style={{ color: "var(--primary)" }}>
            Browse categories
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        <nav className="mb-6 text-sm">
          <Link href="/" className="opacity-80 hover:opacity-100" style={{ color: "var(--foreground)" }}>
            Home
          </Link>
          <span className="mx-2 opacity-60">/</span>
          <Link href="/categories" className="opacity-80 hover:opacity-100" style={{ color: "var(--foreground)" }}>
            Shop
          </Link>
          <span className="mx-2 opacity-60">/</span>
          <span style={{ color: "var(--foreground)" }}>{product.name}</span>
        </nav>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden flex flex-col sm:flex-row">
          <div
            className="w-full sm:w-72 h-64 sm:h-96 flex items-center justify-center text-6xl font-bold opacity-20"
            style={{ backgroundColor: "var(--secondary)" }}
          >
            {product.name.charAt(0)}
          </div>
          <div className="flex-1 p-6 sm:p-8 flex flex-col">
            {product.categoryName && (
              <span
                className="text-xs font-medium uppercase tracking-wider mb-2 inline-block"
                style={{ color: "var(--primary)" }}
              >
                {product.categoryName}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
              {product.name}
            </h1>
            <p className="text-2xl font-bold mb-4" style={{ color: "var(--primary)" }}>
              ₦{Number(product.price).toLocaleString()}
            </p>
            {product.description && (
              <p className="text-sm opacity-90 mb-4 line-clamp-4" style={{ color: "var(--foreground)" }}>
                {product.description}
              </p>
            )}
            <div className="mt-auto space-y-3">
              {!inStock && (
                <p className="text-sm" style={{ color: "var(--error)" }}>
                  Out of stock — check back later.
                </p>
              )}
              {message && (
                <p className="text-sm" style={{ color: "var(--success)" }}>
                  {message}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={!inStock || adding}
                  onClick={addToCart}
                  className="rounded-full px-6 py-3 font-semibold text-white disabled:opacity-50 hover:opacity-95 transition-opacity"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  {adding ? "Adding…" : "Add to cart"}
                </button>
                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 font-semibold border-2 transition-colors"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)" }}
                >
                  View cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
