"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number | null;
  is_active: boolean;
  vendor_name: string;
  vendor_slug: string;
  category?: string | null;
  size_label?: string | null;
  ingredients?: string | null;
  nutritional_info?: string | null;
};

type VendorProfile = { business_name?: string; slug?: string } | null;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendor, setVendor] = useState<VendorProfile>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    sizeLabel: "",
    ingredients: "",
    nutritionalInfo: "",
  });

  useEffect(() => {
    const opts = { credentials: "include" as RequestCredentials };
    Promise.all([
      fetch(`${API_BASE}/products/me`, opts),
      fetch(`${API_BASE}/vendors/me/profile`, opts),
    ])
      .then(async ([productsRes, profileRes]) => {
        const productsData = (await productsRes.json()) as { data?: Product[] };
        setProducts(productsData.data ?? []);
        if (profileRes.ok) {
          const profile = (await profileRes.json()) as VendorProfile;
          setVendor(profile);
        } else {
          setVendor(null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || Number.isNaN(price) || price < 0) {
      setMessage({ type: "err", text: "Name and a valid price are required." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(`${API_BASE}/products/me`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          price,
          stock: form.stock.trim() ? Number(form.stock) : undefined,
          category: form.category.trim() || undefined,
          sizeLabel: form.sizeLabel.trim() || undefined,
          ingredients: form.ingredients.trim() || undefined,
          nutritionalInfo: form.nutritionalInfo.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.message || "Failed to add product." });
        return;
      }
      setMessage({ type: "ok", text: "Product added." });
      setForm({
        name: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        sizeLabel: "",
        ingredients: "",
        nutritionalInfo: "",
      });
      setShowForm(false);
      setProducts((prev) => [{ ...data, vendor_name: vendor?.business_name ?? "", vendor_slug: vendor?.slug ?? "" }, ...prev]);
    } catch {
      setMessage({ type: "err", text: "Request failed." });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <p className="text-zinc-500">Loading products…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Products</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Manage founder admin store products that appear on the homepage and in categories.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
        >
          {showForm ? "Cancel" : "Add product"}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      {showForm && (
        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-zinc-800 mb-4">New product</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="product-name" className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
              <input
                id="product-name"
                name="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                required
              />
            </div>
            <div>
              <label htmlFor="product-desc" className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <textarea
                id="product-desc"
                name="description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-category" className="block text-sm font-medium text-zinc-700 mb-1">
                  Category
                </label>
                <input
                  id="product-category"
                  name="category"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  placeholder="Parfaits, Small Chops, Banana Bread"
                />
              </div>
              <div>
                <label htmlFor="product-size" className="block text-sm font-medium text-zinc-700 mb-1">
                  Size / portion
                </label>
                <input
                  id="product-size"
                  name="size"
                  value={form.sizeLabel}
                  onChange={(e) => setForm((f) => ({ ...f, sizeLabel: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  placeholder="E.g. 300ml cup, family tray"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="product-price" className="block text-sm font-medium text-zinc-700 mb-1">Price (₦) *</label>
                <input
                  id="product-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="product-stock" className="block text-sm font-medium text-zinc-700 mb-1">Stock</label>
                <input
                  id="product-stock"
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                />
              </div>
            </div>
            <div>
              <label htmlFor="product-ingredients" className="block text-sm font-medium text-zinc-700 mb-1">
                Ingredients / contents
              </label>
              <textarea
                id="product-ingredients"
                value={form.ingredients}
                onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                rows={2}
                placeholder="List what you use to make this item. This builds customer trust."
              />
            </div>
            <div>
              <label htmlFor="product-nutrition" className="block text-sm font-medium text-zinc-700 mb-1">
                Nutritional details
              </label>
              <textarea
                id="product-nutrition"
                value={form.nutritionalInfo}
                onChange={(e) => setForm((f) => ({ ...f, nutritionalInfo: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                rows={2}
                placeholder="Optional: calories, sugar level, allergen notes, etc."
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add product"}
            </button>
          </form>
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <h2 className="text-lg font-semibold text-zinc-800 p-4 border-b border-zinc-100">Your products</h2>
        {products.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
              No products yet. Add one above.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {products.map((p) => (
              <li key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium text-zinc-900">{p.name}</span>
                  {!p.is_active && <span className="ml-2 text-xs text-amber-600">(inactive)</span>}
                    <p className="text-sm text-zinc-500 mt-0.5">
                      ₦{Number(p.price).toLocaleString()} · {p.vendor_name}
                    </p>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {p.category && <span className="mr-2">Category: {p.category}</span>}
                      {p.size_label && <span>Size: {p.size_label}</span>}
                    </div>
                    {p.ingredients && (
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                        <span className="font-semibold">Contents: </span>
                        {p.ingredients}
                      </p>
                    )}
                </div>
                <Link
                  href="/dashboard/vendor"
                  className="text-sm text-zinc-600 hover:underline"
                >
                  Manage in vendor dashboard →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
