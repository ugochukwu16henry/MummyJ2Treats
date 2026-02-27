"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type BlogStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

type VendorBlogPost = {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  created_at: string;
  published_at: string | null;
};

export default function VendorBlogPage() {
  const [posts, setPosts] = useState<VendorBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [fileUploadingId, setFileUploadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [signupFeePaid, setSignupFeePaid] = useState<boolean>(false);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/blog/me`, { credentials: "include" });
      if (!res.ok) {
        setPosts([]);
        return;
      }
      const data = (await res.json()) as { data?: VendorBlogPost[] };
      setPosts(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
    // Check vendor profile for signup fee
    fetch(`${API_BASE}/vendors/me/profile`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : null)
      .then((profile) => setSignupFeePaid(!!profile?.signup_fee_paid))
      .catch(() => setSignupFeePaid(false));
  }, []);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body: any = {
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || undefined,
        category: category.trim() || undefined,
      };
      if (embedUrl.trim()) {
        body.mediaEmbeds = [{ url: embedUrl.trim() }];
      }
      const res = await fetch(`${API_BASE}/blog/me`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Could not create blog post.");
        return;
      }
      setTitle("");
      setExcerpt("");
      setContent("");
      setCategory("");
      setEmbedUrl("");
      await loadPosts();
    } finally {
      setSaving(false);
    }
  }

  async function submitForReview(id: string) {
    setSubmittingId(id);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/blog/me/${id}/submit`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Could not submit post for review.");
        return;
      }
      await loadPosts();
    } finally {
      setSubmittingId(null);
    }
  }

  async function uploadVideo(id: string, file: File | null) {
    if (!file) return;
    setFileUploadingId(id);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/blog/me/${id}/upload-video`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "Could not upload video.");
        return;
      }
      await loadPosts();
    } finally {
      setFileUploadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 flex flex-col">
      <div className="max-w-4xl mx-auto space-y-6 flex-1 w-full">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold">Your Blog</h1>
          <p className="text-sm text-zinc-600">
            Share stories, behind-the-scenes, and tips with customers. Draft posts here, then submit for{" "}
            <span className="font-semibold">founder admin approval</span> before they appear on the public blog.
          </p>
        </header>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Create new post</h2>
          {!signupFeePaid && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-4">
              You must pay the ₦20,000 vendor signup fee before posting blogs. Please contact admin for payment instructions.
            </div>
          )}
          <form onSubmit={createDraft} className="space-y-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                placeholder="E.g. How we prepare jollof rice for 200 guests"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Category</label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                  placeholder="E.g. Catering, Baking, Event tips"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Optional embed link (YouTube, TikTok, X, Instagram…)
                </label>
                <input
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Paste a full URL to embed"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Short summary</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                rows={2}
                maxLength={200}
                placeholder="One or two sentences that describe this post."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Story content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                rows={5}
                placeholder="Write your story, tips, or behind-the-scenes here. You can add more embeds later."
              />
            </div>
            <button
              type="submit"
              disabled={saving || !signupFeePaid}
              className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving draft…" : "Save draft"}
            </button>
          </form>
          <p className="text-[11px] text-zinc-500">
            To share house-made videos directly, upload them to a draft post below. You can also paste links from
            YouTube, TikTok, X, Facebook, Instagram, or any video platform.
          </p>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">Your posts</h2>
          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="text-sm text-zinc-500">No posts yet. Create your first story above.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {posts.map((p) => (
                <li
                  key={p.id}
                  className="border border-zinc-100 rounded-xl px-3 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-zinc-900">{p.title}</div>
                    <div className="text-[11px] text-zinc-500">
                      Status: <span className="font-medium">{p.status}</span> ·{" "}
                      {new Date(p.created_at).toLocaleString()}
                      {p.published_at && ` · Published ${new Date(p.published_at).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    {p.status === "DRAFT" || p.status === "REJECTED" ? (
                      <button
                        type="button"
                        disabled={submittingId === p.id}
                        onClick={() => submitForReview(p.id)}
                        className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {submittingId === p.id ? "Submitting…" : "Submit for review"}
                      </button>
                    ) : null}
                    <label className="text-[11px] text-zinc-600 cursor-pointer">
                      <span className="inline-block px-3 py-1 rounded-full border border-zinc-300 hover:bg-zinc-50">
                        {fileUploadingId === p.id ? "Uploading video…" : "Upload house video"}
                      </span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/ogg"
                        className="hidden"
                        onChange={(e) => uploadVideo(p.id, e.target.files?.[0] ?? null)}
                      />
                    </label>
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View on blog
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

