"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type BlogStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

type FounderBlogPost = {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  created_at: string;
  published_at: string | null;
};

export default function AdminMyBlogPage() {
  const [posts, setPosts] = useState<FounderBlogPost[]>([]);
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    embedUrl: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  function getOpts(): RequestInit {
    const cookie = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
    const token = cookie?.replace(/^access_token=/, "").trim();
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    return { credentials: "include", headers };
  }

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/blog/me`, getOpts());
      if (!res.ok) {
        setPosts([]);
        return;
      }
      const data = (await res.json()) as { data?: FounderBlogPost[] };
      setPosts(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    if (!editingId) return;
    setEditLoading(true);
    fetch(`${API_BASE}/blog/me/${editingId}`, getOpts())
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load"))))
      .then((post: { title?: string; excerpt?: string | null; content?: string; category?: string | null; media_embeds?: { url: string }[] }) => {
        setEditForm({
          title: post.title ?? "",
          excerpt: post.excerpt ?? "",
          content: post.content ?? "",
          category: post.category ?? "",
          embedUrl: post.media_embeds?.[0]?.url ?? "",
        });
      })
      .catch(() => setError("Could not load post for editing"))
      .finally(() => setEditLoading(false));
  }, [editingId]);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
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
        ...getOpts(),
        headers: { ...(getOpts().headers as Record<string, string>), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? "Could not create blog post.");
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
        ...getOpts(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? "Could not submit post for review.");
        return;
      }
      await loadPosts();
    } finally {
      setSubmittingId(null);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editForm.title.trim() || !editForm.content.trim()) return;
    setEditSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        title: editForm.title.trim(),
        content: editForm.content.trim(),
        excerpt: editForm.excerpt.trim() || null,
        category: editForm.category.trim() || null,
      };
      if (editForm.embedUrl.trim()) {
        body.mediaEmbeds = [{ url: editForm.embedUrl.trim() }];
      }
      const res = await fetch(`${API_BASE}/blog/me/${editingId}`, {
        method: "PATCH",
        ...getOpts(),
        headers: { ...(getOpts().headers as Record<string, string>), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? "Could not update post.");
        return;
      }
      setEditingId(null);
      await loadPosts();
    } finally {
      setEditSaving(false);
    }
  }

  async function uploadVideo(id: string, file: File | null) {
    if (!file) return;
    setFileUploadingId(id);
    setError(null);
    const ac = new AbortController();
    const timeoutId = setTimeout(() => ac.abort(), 5 * 60 * 1000); // 5 min for large videos
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/blog/me/${id}/upload-video`, {
        method: "POST",
        ...getOpts(),
        body: form,
        signal: ac.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? "Could not upload video.");
        return;
      }
      await loadPosts();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Upload timed out. Try a smaller video or check your connection.");
        } else {
          setError(err.message || "Could not upload video.");
        }
      } else {
        setError("Could not upload video.");
      }
    } finally {
      setFileUploadingId(null);
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">My blog</h1>
        <p className="text-sm text-zinc-600 mt-0.5">
          Write and edit your own posts for the public blog. Add videos by pasting a link (YouTube, TikTok, etc.) or
          uploading a file. Submit for review to publish; you can approve your own posts from Blog moderation.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Create new post</h2>
        <form onSubmit={createDraft} className="space-y-3 text-sm">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
              placeholder="E.g. How we built MummyJ2Treats"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                placeholder="E.g. Company, Tips, News"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Share a video link (YouTube, TikTok, X, Instagram…)
              </label>
              <input
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
                className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                placeholder="Paste full URL to embed"
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
              placeholder="One or two sentences describing this post."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
              rows={5}
              placeholder="Write your post. You can add more videos later via upload or links."
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
          >
            {saving ? "Saving draft…" : "Save draft"}
          </button>
        </form>
        <p className="text-[11px] text-zinc-500">
          To add your own video file, save the draft first, then use &quot;Upload video&quot; on the post below. You can
          also paste links from YouTube, TikTok, X, Instagram, or other platforms above.
        </p>
      </section>

      {editingId && (
        <section className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold">Edit post</h2>
          {editLoading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            <form onSubmit={saveEdit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Title *</label>
                <input
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Category</label>
                <input
                  value={editForm.category}
                  onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Video link</label>
                <input
                  value={editForm.embedUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, embedUrl: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                  placeholder="YouTube, TikTok, etc."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Summary</label>
                <textarea
                  value={editForm.excerpt}
                  onChange={(e) => setEditForm((f) => ({ ...f, excerpt: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Content *</label>
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm((f) => ({ ...f, content: e.target.value }))}
                  className="w-full border border-zinc-300 rounded-md px-3 py-2 text-sm"
                  rows={5}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
                >
                  {editSaving ? "Saving…" : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 rounded-full border border-zinc-300 text-zinc-700 text-sm hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-3">Your posts</h2>
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-zinc-500">No posts yet. Create your first post above.</p>
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
                  {(p.status === "DRAFT" || p.status === "REJECTED") && (
                    <button
                      type="button"
                      disabled={submittingId === p.id}
                      onClick={() => submitForReview(p.id)}
                      className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {submittingId === p.id ? "Submitting…" : "Submit for review"}
                    </button>
                  )}
                  <label className="text-[11px] text-zinc-600 cursor-pointer">
                    <span className="inline-block px-3 py-1 rounded-full border border-zinc-300 hover:bg-zinc-50">
                      {fileUploadingId === p.id ? "Uploading video…" : "Upload video"}
                    </span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg"
                      className="hidden"
                      disabled={fileUploadingId === p.id}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        const input = e.target;
                        uploadVideo(p.id, file).finally(() => {
                          input.value = "";
                        });
                      }}
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
                  <button
                    type="button"
                    onClick={() => setEditingId(p.id)}
                    className="text-xs text-zinc-600 hover:underline"
                  >
                    Edit
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
