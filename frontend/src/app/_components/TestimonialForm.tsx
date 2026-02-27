"use client";

import { useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function TestimonialForm({
  target,
  vendorSlug,
}: {
  target: "founder" | "vendor";
  vendorSlug?: string;
}) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      setMessage("Please write a testimonial.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      let finalImageUrl: string | undefined = imageUrl.trim() || undefined;

      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(`${API_BASE}/testimonials/upload-image`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!uploadRes.ok) {
          const b = await uploadRes.json().catch(() => ({}));
          setMessage(b.message ?? "Could not upload image.");
          return;
        }
        const uploaded = (await uploadRes.json().catch(() => ({}))) as { url?: string };
        if (uploaded.url) {
          finalImageUrl = uploaded.url;
        }
      }

      const res = await fetch(`${API_BASE}/testimonials`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          imageUrl: finalImageUrl,
          target,
          vendorSlug: target === "vendor" ? vendorSlug : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage(body.message ?? "Could not submit testimonial.");
        return;
      }
      setContent("");
      setImageUrl("");
      setFile(null);
      setMessage("Thank you! Your testimonial is pending approval.");
    } catch {
      setMessage("Could not submit testimonial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 max-w-xl mx-auto space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Share your experience with MummyJ2Treats..."
        className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
          }}
          className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm bg-white"
        />
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Or paste image URL (optional)"
          className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm"
        />
      </div>
      {message && <p className="text-xs text-zinc-600">{message}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium disabled:opacity-60"
      >
        {submitting ? "Sending..." : "Submit testimonial"}
      </button>
    </form>
  );
}

