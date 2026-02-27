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
  category?: string | null;
  size_label?: string | null;
  ingredients?: string | null;
  nutritional_info?: string | null;
};

type VendorProfile = { business_name?: string; is_verified?: boolean } | null;

export default function VendorProductsPage() {
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

  async function load() {
    setLoading(true);
    try {
      const [productsRes, profileRes] = await Promise.all([
        fetch(`${API_BASE}/products/me`, { credentials: "include" }),
        fetch(`${API_BASE}/vendors/me/profile`, { credentials: "include" }),
      ]);
      const productsData = (await productsRes.json().catch(() => ({}))) as { data?: Product[] };
      setProducts(productsData.data ?? []);
      if (profileRes.ok) {
        const profile = await profileRes.json();
        setVendor({
          business_name: profile.business_name ?? "",
          is_verified: !!profile.is_verified,
        });
      } else {
        setVendor(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
          const [signupFeePaid, setSignupFeePaid] = useState<boolean>(false);
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
                setSignupFeePaid(!!profile.signup_fee_paid);
          sizeLabel: form.sizeLabel.trim() || undefined,
          ingredients: form.ingredients.trim() || undefined,
          nutritionalInfo: form.nutritionalInfo.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "err", text: data.message ?? "Failed to add product. Make sure your vendor is approved and active." });
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
      setProducts((prev) => [data as Product, ...prev]);
    } catch {
      setMessage({ type: "err", text: "Request failed." });
    } finally {
      setSubmitting(false);
    }
  }

  const hasVendor = !!vendor;

  if (loading && !products.length && !vendor) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center py-20 text-zinc-500">Loading products…</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">My products</h1>
            <p className="text-sm text-zinc-600 mt-0.5">
              {hasVendor
                ? vendor?.is_verified
                  ? "Add and manage the items you sell."
                  : "Your vendor is not verified yet. Ask admin to approve you before products go live."
                : "You need a vendor profile to add products."}
            </p>
          </div>
          <Link href="/dashboard/vendor" className="text-sm text-zinc-600 hover:underline">
            ← Vendor dashboard
          </Link>
        </header>

        {!hasVendor && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            You don’t have a vendor account yet. Visit the{" "}
            <Link href="/dashboard/vendor" className="font-medium underline">
              vendor dashboard
            </Link>{" "}
            to create one.
          </div>
        )}

        {message && (
          <p className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
        )}

        {hasVendor && (
          <section className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-800">Add product</h2>
              <button
                type="button"
                onClick={() => setShowForm((v) => !v)}
                className="px-3 py-1.5 rounded-md border border-zinc-300 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                {showForm ? "Close" : "New product"}
              </button>
            </div>
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="vendor-product-name" className="block text-sm font-medium text-zinc-700 mb-1">
                    Name *
                  </label>
                  <input
                    id="vendor-product-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="vendor-product-desc" className="block text-sm font-medium text-zinc-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="vendor-product-desc"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vendor-product-category" className="block text-sm font-medium text-zinc-700 mb-1">
                      Category
                    </label>
                    <input
                      id="vendor-product-category"
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                      placeholder="E.g. Parfaits, Catering, Snacks"
                    />
                  </div>
                  <div>
                    <label htmlFor="vendor-product-size" className="block text-sm font-medium text-zinc-700 mb-1">
                      Size / portion
                    </label>
                    <input
                      id="vendor-product-size"
                      value={form.sizeLabel}
                      onChange={(e) => setForm((f) => ({ ...f, sizeLabel: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                      placeholder="E.g. tray for 10, 300ml cup"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="vendor-product-price" className="block text-sm font-medium text-zinc-700 mb-1">
                      Price (₦) *
                    </label>
                    <input
                      id="vendor-product-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="vendor-product-stock" className="block text-sm font-medium text-zinc-700 mb-1">
                      Stock
                    </label>
                    <input
                      id="vendor-product-stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="vendor-product-ingredients" className="block text-sm font-medium text-zinc-700 mb-1">
                    Ingredients / contents
                  </label>
                  <textarea
                    id="vendor-product-ingredients"
                    value={form.ingredients}
                    onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    rows={2}
                    placeholder="List what you use to make this item. This builds customer trust."
                  />
                </div>
                <div>
                  <label htmlFor="vendor-product-nutrition" className="block text-sm font-medium text-zinc-700 mb-1">
                    Nutritional details
                  </label>
                  <textarea
                    id="vendor-product-nutrition"
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
                  {submitting ? "Saving…" : "Save product"}
                </button>
              </form>
            )}
          </section>
        )}

        <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <h2 className="text-lg font-semibold text-zinc-800 p-4 border-b border-zinc-100">Existing products</h2>
          {products.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">
              {hasVendor ? "No products yet. Use the form above to add your first item." : "No products to show."}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <div className="font-medium text-zinc-900">{p.name}</div>
                    <div className="text-xs text-zinc-500">
                      ₦{Number(p.price).toLocaleString()} · Stock {p.stock ?? 0}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {p.category && <span className="mr-2">Category: {p.category}</span>}
                      {p.size_label && <span>Size: {p.size_label}</span>}
                    </div>
                    {p.ingredients && (
                      <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">
                        <span className="font-semibold">Contents: </span>
                        {p.ingredients}
                      </div>
                    )}
                  </div>
                  {!p.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 self-start sm:self-auto">
                      Inactive
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

