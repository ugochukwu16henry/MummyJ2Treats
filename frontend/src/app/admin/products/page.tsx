"use client";

import React, { useEffect, useState } from "react";
import { API_BASE } from "../../../lib/apiBase";

type Category = {
  id: string;
  name: string;
};

export default function AdminAddProductPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [size, setSize] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch(`${API_BASE}/categories`);
        if (!res.ok) return;
        const data = (await res.json()) as { id: string; name: string }[];
        setCategories(data);
        if (data.length > 0) {
          setCategoryId(data[0].id);
        }
      } catch {
        // ignore for now
      }
    }
    loadCategories();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setPreview(null);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !categoryId) {
      setMessage("Name, price, and category are required.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("price", price.trim());
      fd.append("size", size.trim());
      fd.append("description", description.trim());
      fd.append("categoryId", categoryId);
      fd.append("isActive", String(isActive));
      if (imageFile) {
        fd.append("image", imageFile);
      }
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
      const res = await fetch(`${API_BASE}/admin/products`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(body?.message ?? "Failed to add product.");
        return;
      }
      setMessage("Product listed on MummyJ2Treats.");
      setName("");
      setPrice("");
      setSize("");
      setDescription("");
      setIsActive(true);
      setImageFile(null);
      setPreview(null);
    } catch {
      setMessage("Network error while saving product.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Treat</h1>
        <p className="text-sm text-gray-500 mb-6">
          Create a new product with photo, size, and category. You&apos;ll see a live preview of how it looks in the shop.
        </p>

        {message && (
          <p className="mb-4 text-sm font-medium text-gray-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            {message}
          </p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form */}
          <div className="max-w-xl bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vanilla Strawberry Cake"
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 outline-none transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="15000"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size/Weight</label>
                  <input
                    type="text"
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    placeholder="e.g. 1kg or 12pcs"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 outline-none bg-white"
                  >
                    {categories.length === 0 ? (
                      <option value="">No categories yet</option>
                    ) : (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    Available (not sold out)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the ingredients or the vibe..."
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-pink-400 outline-none"
                />
              </div>

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover rounded-xl" alt="Preview" />
                ) : (
                  <div className="text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="mt-1 text-sm text-gray-600">Click to upload product photo</p>
                  </div>
                )}
                <input
                  type="file"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-pink-600 shadow-lg shadow-gray-200 transition-all disabled:opacity-60"
              >
                {submitting ? "Listing product…" : "List Product on MummyJ2Treats"}
              </button>
            </form>
          </div>

          {/* Live preview */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Live preview</h2>
            <div className="max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
              <div className="relative h-64 bg-gray-100">
                {preview ? (
                  <img src={preview} alt={name || "Treat preview"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    Product photo will appear here
                  </div>
                )}
                {isActive ? (
                  <span className="absolute top-3 right-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Popular
                  </span>
                ) : (
                  <span className="absolute top-3 right-3 bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Sold out
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {name || "Your treat name"}
                  </h3>
                  <span className="text-lg font-bold text-pink-600">
                    {price ? `₦${Number(price).toLocaleString()}` : "₦0"}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  {description || "Describe the flavour, ingredients, or the feeling this treat gives your customers."}
                </p>

                <div className="flex gap-2 mb-6">
                  <button className="px-3 py-1 border border-gray-200 rounded-md text-xs hover:bg-pink-50">
                    Small
                  </button>
                  <button className="px-3 py-1 border border-pink-500 bg-pink-50 rounded-md text-xs text-pink-600 font-medium">
                    {size || "Standard"}
                  </button>
                  <button className="px-3 py-1 border border-gray-200 rounded-md text-xs hover:bg-pink-50">
                    Large
                  </button>
                </div>

                <button
                  type="button"
                  className="w-full bg-gray-900 text-white py-3 rounded-xl font-medium flex justify-center items-center gap-2 opacity-70 cursor-default"
                >
                  Add to Cart (preview only)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

