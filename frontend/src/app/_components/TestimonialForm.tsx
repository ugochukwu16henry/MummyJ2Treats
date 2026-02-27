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
      const res = await fetch(`${API_BASE}/testimonials`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          imageUrl: imageUrl.trim() || undefined,
          target,
          vendorSlug: target === "vendor" ? vendorSlug : undefined,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setMessage("Please log in to submit a testimonial.");
          return;
        }
        const body = await res.json().catch(() => ({}));
        setMessage(body.message ?? "Could not submit testimonial.");
        return;
      }
      setContent("");
      setImageUrl("");
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
      <input
        type="url"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Link to your photo (optional)"
        className="w-full border border-zinc-300 rounded-xl px-3 py-2 text-sm"
      />
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

