"use client";

import { useEffect, useState } from "react";

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
  image_url?: string | null;
};

type FounderCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

type VendorProfile = { business_name?: string; slug?: string } | null;

function toFullUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("/") ? `${API_BASE.replace(/\/$/, "")}${url}` : url;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<FounderCategory[]>([]);
  const [vendor, setVendor] = useState<VendorProfile>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
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
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "" });

  const getAuthHeaders = (): HeadersInit => {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    const token = cookie?.replace(/^access_token=/, "").trim();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const opts = () => ({ credentials: "include" as RequestCredentials, headers: getAuthHeaders() });

  function loadData() {
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/products/me`, opts()),
      fetch(`${API_BASE}/vendors/me/profile`, opts()),
      fetch(`${API_BASE}/admin/founder-categories`, opts()),
    ])
      .then(async ([productsRes, profileRes, categoriesRes]) => {
        const productsData = (await productsRes.json()) as { data?: Product[] };
        setProducts(productsData.data ?? []);
        if (profileRes.ok) {
          const profile = (await profileRes.json()) as VendorProfile;
          setVendor(profile);
        } else setVendor(null);
        if (categoriesRes.ok) {
          const catData = (await categoriesRes.json()) as { data?: FounderCategory[] };
          setCategories(catData.data ?? []);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSubmitProduct(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim() || Number.isNaN(price) || price < 0) {
      setMessage({ type: "err", text: "Name and a valid price are required." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      if (editingProductId) {
        const res = await fetch(`${API_BASE}/products/me/${editingProductId}`, {
          method: "PATCH",
          ...opts(),
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
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
        if (!res.ok) {
          const data = await res.json();
          setMessage({ type: "err", text: data.message || "Update failed." });
          return;
        }
        if (productImageFile) {
          const fd = new FormData();
          fd.append("file", productImageFile);
          await fetch(`${API_BASE}/products/me/${editingProductId}/image`, {
            method: "POST",
            ...opts(),
            body: fd,
          });
        }
        setMessage({ type: "ok", text: "Product updated." });
        setEditingProductId(null);
      } else {
        const res = await fetch(`${API_BASE}/products/me`, {
          method: "POST",
          ...opts(),
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
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
        const newId = data.id;
        if (productImageFile && newId) {
          const fd = new FormData();
          fd.append("file", productImageFile);
          await fetch(`${API_BASE}/products/me/${newId}/image`, {
            method: "POST",
            ...opts(),
            body: fd,
          });
        }
        setMessage({ type: "ok", text: "Product added." });
        setProducts((prev) => [{ ...data, vendor_name: vendor?.business_name ?? "", vendor_slug: vendor?.slug ?? "" }, ...prev]);
      }
      setForm({ name: "", description: "", price: "", stock: "", category: "", sizeLabel: "", ingredients: "", nutritionalInfo: "" });
      setProductImageFile(null);
      setShowForm(false);
      loadData();
    } catch {
      setMessage({ type: "err", text: "Request failed." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Delete this product?")) return;
    setDeletingProductId(id);
    try {
      const res = await fetch(`${API_BASE}/products/me/${id}`, { method: "DELETE", ...opts() });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setMessage({ type: "ok", text: "Product deleted." });
      } else setMessage({ type: "err", text: "Delete failed." });
    } finally {
      setDeletingProductId(null);
    }
  }

  async function handleSubmitCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      setMessage({ type: "err", text: "Category name is required." });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const slug = categoryForm.slug.trim() || categoryForm.name.trim().toLowerCase().replace(/\s+/g, "-");
    try {
      if (editingCategoryId) {
        const res = await fetch(`${API_BASE}/admin/founder-categories/${editingCategoryId}`, {
          method: "PATCH",
          ...opts(),
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryForm.name.trim(), slug, description: categoryForm.description.trim() || undefined }),
        });
        if (!res.ok) {
          setMessage({ type: "err", text: "Update failed." });
          return;
        }
        if (categoryImageFile) {
          const fd = new FormData();
          fd.append("file", categoryImageFile);
          await fetch(`${API_BASE}/admin/founder-categories/${editingCategoryId}/image`, { method: "POST", ...opts(), body: fd });
        }
        setMessage({ type: "ok", text: "Category updated." });
        setEditingCategoryId(null);
      } else {
        const res = await fetch(`${API_BASE}/admin/founder-categories`, {
          method: "POST",
          ...opts(),
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ name: categoryForm.name.trim(), slug, description: categoryForm.description.trim() || undefined }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessage({ type: "err", text: data.message || "Add failed." });
          return;
        }
        const newId = data.id;
        if (categoryImageFile && newId) {
          const fd = new FormData();
          fd.append("file", categoryImageFile);
          await fetch(`${API_BASE}/admin/founder-categories/${newId}/image`, { method: "POST", ...opts(), body: fd });
        }
        setMessage({ type: "ok", text: "Category added." });
      }
      setCategoryForm({ name: "", slug: "", description: "" });
      setCategoryImageFile(null);
      setShowCategoryForm(false);
      loadData();
    } catch {
      setMessage({ type: "err", text: "Request failed." });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm("Delete this category? Products will keep their category text but the homepage card will be removed.")) return;
    setDeletingCategoryId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/founder-categories/${id}`, { method: "DELETE", ...opts() });
      if (res.ok) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        setMessage({ type: "ok", text: "Category deleted." });
      } else setMessage({ type: "err", text: "Delete failed." });
    } finally {
      setDeletingCategoryId(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Products &amp; Categories</h1>
          <p className="text-sm text-zinc-600 mt-0.5">
            Manage founder store products and the categories shown on the homepage.
          </p>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      {/* Founder categories (homepage cards) */}
      <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-800">Homepage categories</h2>
          <button
            type="button"
            onClick={() => {
              setShowCategoryForm((v) => !v);
              setEditingCategoryId(null);
              if (!showCategoryForm) setCategoryForm({ name: "", slug: "", description: "" });
            }}
            className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
          >
            {showCategoryForm ? "Cancel" : "Add category"}
          </button>
        </div>
        {showCategoryForm && (
          <form onSubmit={handleSubmitCategory} className="p-6 border-b border-zinc-100 space-y-4 max-w-md">
            <h3 className="font-medium text-zinc-800">{editingCategoryId ? "Edit category" : "New category"}</h3>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
              <input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Slug (URL)</label>
              <input
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                placeholder="e.g. parfaits"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
              <input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Category image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCategoryImageFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-zinc-600"
              />
            </div>
            <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium disabled:opacity-50">
              {submitting ? "Saving…" : editingCategoryId ? "Update" : "Add"}
            </button>
          </form>
        )}
        {categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No categories yet. Add one to show on the homepage.</div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {categories.map((c) => (
              <li key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {c.image_url ? (
                    <img src={toFullUrl(c.image_url) ?? c.image_url} alt={c.name} className="w-14 h-14 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs">No image</div>
                  )}
                  <div>
                    <span className="font-medium text-zinc-900">{c.name}</span>
                    <span className="text-zinc-500 text-sm ml-2">/{c.slug}</span>
                    {c.description && <p className="text-xs text-zinc-500 mt-0.5">{c.description}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(c.id);
                      setCategoryForm({ name: c.name, slug: c.slug, description: c.description ?? "" });
                      setShowCategoryForm(true);
                    }}
                    className="text-sm text-zinc-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(c.id)}
                    disabled={deletingCategoryId === c.id}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingCategoryId === c.id ? "…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Products */}
      <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-zinc-100 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-800">Products</h2>
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setEditingProductId(null);
              if (!showForm) setForm({ name: "", description: "", price: "", stock: "", category: "", sizeLabel: "", ingredients: "", nutritionalInfo: "" });
            }}
            className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800"
          >
            {showForm ? "Cancel" : "New product"}
          </button>
        </div>

        {showForm && (
          <section className="p-6 border-b border-zinc-100">
            <h2 className="text-lg font-semibold text-zinc-800 mb-4">{editingProductId ? "Edit product" : "New product"}</h2>
            <form onSubmit={handleSubmitProduct} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Product image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProductImageFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-zinc-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
                  <input
                    list="category-list"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Parfaits, Small Chops, Banana Bread"
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  />
                  <datalist id="category-list">
                    {categories.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Size / portion</label>
                  <input
                    value={form.sizeLabel}
                    onChange={(e) => setForm((f) => ({ ...f, sizeLabel: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                    placeholder="E.g. 300ml cup"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Price (₦) *</label>
                  <input
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
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Ingredients / contents</label>
                <textarea
                  value={form.ingredients}
                  onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Nutritional details</label>
                <textarea
                  value={form.nutritionalInfo}
                  onChange={(e) => setForm((f) => ({ ...f, nutritionalInfo: e.target.value }))}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                  rows={2}
                />
              </div>
              <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium disabled:opacity-50">
                {submitting ? "Saving…" : editingProductId ? "Update product" : "Add product"}
              </button>
            </form>
          </section>
        )}

        {products.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">No products yet. Add one above.</div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {products.map((p) => (
              <li key={p.id} className="p-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    <img src={toFullUrl(p.image_url) ?? p.image_url} alt={p.name} className="w-14 h-14 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs">No photo</div>
                  )}
                  <div>
                    <span className="font-medium text-zinc-900">{p.name}</span>
                    {!p.is_active && <span className="ml-2 text-xs text-amber-600">(inactive)</span>}
                    <p className="text-sm text-zinc-500 mt-0.5">₦{Number(p.price).toLocaleString()} · {p.vendor_name}</p>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {p.category && <span className="mr-2">Category: {p.category}</span>}
                      {p.size_label && <span>Size: {p.size_label}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProductId(p.id);
                      setForm({
                        name: p.name,
                        description: p.description ?? "",
                        price: String(p.price),
                        stock: p.stock != null ? String(p.stock) : "",
                        category: p.category ?? "",
                        sizeLabel: p.size_label ?? "",
                        ingredients: p.ingredients ?? "",
                        nutritionalInfo: p.nutritional_info ?? "",
                      });
                      setShowForm(true);
                    }}
                    className="text-sm text-zinc-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p.id)}
                    disabled={deletingProductId === p.id}
                    className="text-sm text-red-600 hover:underline disabled:opacity-50"
                  >
                    {deletingProductId === p.id ? "…" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
