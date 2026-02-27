"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type BlogStatus = "DRAFT" | "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "ARCHIVED";

type AdminBlogPost = {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  created_at: string;
  published_at: string | null;
  author_name: string | null;
  author_slug: string | null;
};

export default function AdminBlogModerationPage() {
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BlogStatus | "ALL">("PENDING_REVIEW");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadPosts(nextStatus: BlogStatus | "ALL" = statusFilter) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (nextStatus !== "ALL") {
        params.set("status", nextStatus);
      }
      const res = await fetch(`${API_BASE}/blog/admin/posts?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) {
        setPosts([]);
        return;
      }
      const data = (await res.json()) as { data?: AdminBlogPost[] };
      setPosts(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts("PENDING_REVIEW");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function mutate(id: string, action: "approve" | "reject" | "archive") {
    try {
      setBusyId(id);
      const res = await fetch(`${API_BASE}/blog/admin/${id}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        return;
      }
      await loadPosts();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Blog moderation</h1>
        <p className="text-sm text-zinc-600 mt-0.5">
          Review and approve vendor and founder blog posts, videos, and images before they appear on the public blog.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between gap-4">
        <div className="text-xs text-zinc-600">
          <div className="font-medium">Workflow</div>
          <p>
            Vendors create drafts → submit for review → founder admin approves or rejects → only{" "}
            <span className="font-semibold">PUBLISHED</span> posts appear on the public blog homepage.
          </p>
        </div>
        <div className="text-xs">
          <label className="block mb-1 text-zinc-600">Filter by status</label>
          <select
            value={statusFilter}
            onChange={async (e) => {
              const next = e.target.value as BlogStatus | "ALL";
              setStatusFilter(next);
              await loadPosts(next);
            }}
            className="border border-zinc-200 rounded-md px-2 py-1 text-xs bg-white"
          >
            <option value="PENDING_REVIEW">Pending review</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="REJECTED">Rejected</option>
            <option value="ARCHIVED">Archived</option>
            <option value="ALL">All</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading posts…</p>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-8 text-center text-zinc-500">
          No blog posts match this filter yet.
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <ul className="divide-y divide-zinc-100">
            {posts.map((p) => (
              <li
                key={p.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
                  <div className="text-xs text-zinc-500">
                    {p.author_name ?? "Unknown author"}
                    {p.author_slug ? ` · /vendor/${p.author_slug}` : ""}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Status: <span className="font-medium">{p.status}</span> · Created{" "}
                    {new Date(p.created_at).toLocaleString()}
                    {p.published_at && ` · Published ${new Date(p.published_at).toLocaleString()}`}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {p.status === "PENDING_REVIEW" && (
                    <>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => mutate(p.id, "approve")}
                        className="px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        {busyId === p.id ? "Approving…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => mutate(p.id, "reject")}
                        className="px-3 py-1 rounded-full border border-amber-500 text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        {busyId === p.id ? "Working…" : "Reject"}
                      </button>
                    </>
                  )}
                  {p.status === "PUBLISHED" && (
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => mutate(p.id, "archive")}
                      className="px-3 py-1 rounded-full border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                    >
                      {busyId === p.id ? "Archiving…" : "Archive"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

