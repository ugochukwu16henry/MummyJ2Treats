"use client";

import { useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type DeletionStatus = {
  deletionRequestedAt: string | null;
  deleteAfter: string | null;
} | null;

function getOpts(): RequestInit {
  const cookie = document.cookie.split("; ").find((c) => c.startsWith("access_token="));
  const token = cookie?.replace(/^access_token=/, "").trim();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  return { credentials: "include", headers };
}

export function DeleteMyAccountSection() {
  const [role, setRole] = useState<string | null>(null);
  const [status, setStatus] = useState<DeletionStatus>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadStatus() {
    fetch(`${API_BASE}/users/me/deletion-status`, getOpts())
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DeletionStatus) => setStatus(data))
      .catch(() => setStatus(null));
  }

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/auth/me`, getOpts())
      .then((res) => (res.ok ? res.json() : null))
      .then((me: { role?: string } | null) => {
        if (cancelled) return;
        const r = me?.role ?? null;
        setRole(r);
        if (r === "customer" || r === "vendor" || r === "rider") {
          return fetch(`${API_BASE}/users/me/deletion-status`, getOpts())
            .then((res) => (res.ok ? res.json() : null))
            .then((data: DeletionStatus) => {
              if (!cancelled) setStatus(data);
            });
        }
      })
      .catch(() => { if (!cancelled) setRole(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function requestDeletion() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/me/request-deletion`, {
        method: "POST",
        ...getOpts(),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { message?: string }).message ?? "Request failed.");
        return;
      }
      setShowConfirm(false);
      loadStatus();
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelDeletion() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users/me/cancel-deletion`, {
        method: "POST",
        ...getOpts(),
      });
      if (res.ok) {
        loadStatus();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || role === null) return null;
  if (role === "admin") return null;

  const deleteAfter = status?.deleteAfter ? new Date(status.deleteAfter) : null;

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 border border-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900 mb-2">Delete my account</h2>
      {deleteAfter ? (
        <div className="space-y-2">
          <p className="text-sm text-zinc-700">
            Your account will be permanently deleted on{" "}
            <strong>{deleteAfter.toLocaleDateString(undefined, { dateStyle: "long" })}</strong>.
          </p>
          <button
            type="button"
            onClick={cancelDeletion}
            disabled={submitting}
            className="text-sm px-3 py-1.5 rounded-md border border-zinc-300 text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {submitting ? "…" : "Cancel deletion"}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-600 mb-3">
            Request account deletion. Your account and data will be permanently removed from our database after two weeks.
          </p>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="text-sm px-3 py-1.5 rounded-md border border-red-500 text-red-600 hover:bg-red-50"
          >
            Delete my account
          </button>
          {showConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
                <h3 className="font-semibold text-zinc-900 mb-2">Are you sure?</h3>
                <p className="text-sm text-zinc-600 mb-4">
                  Your account will be deleted after two weeks. This cannot be undone. You can cancel deletion before that date.
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowConfirm(false)}
                    className="px-4 py-2 rounded-lg border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={requestDeletion}
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {submitting ? "…" : "Yes, delete my account"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
