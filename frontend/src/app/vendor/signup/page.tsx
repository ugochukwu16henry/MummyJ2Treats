\"use client\";

import { useState } from \"react\";
import { useRouter } from \"next/navigation\";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? \"http://localhost:4000\";

export default function VendorSignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(\"\");
  const [description, setDescription] = useState(\"\");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!businessName.trim()) {
      setMessage(\"Please enter a business name.\");
      return;
    }
    setSubmitting(true);
    try {
      // Ensure user is upgraded to vendor and vendor record exists
      const res = await fetch(`${API_BASE}/auth/become-vendor`, {
        method: \"POST\",
        credentials: \"include\",
      });
      if (res.status === 401) {
        setMessage(\"Please log in first to become a vendor.\");
        router.push(\"/auth/login\");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage(body.message ?? \"Could not create vendor account.\");
        return;
      }

      // Update vendor branding with business name + description
      await fetch(`${API_BASE}/vendors/me/branding`, {
        method: \"PATCH\",
        credentials: \"include\",
        headers: { \"Content-Type\": \"application/json\" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          description: description.trim() || undefined,
        }),
      }).catch(() => {});

      router.push(\"/dashboard/vendor\");
    } catch {
      setMessage(\"Something went wrong. Please try again.\");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className=\"min-h-screen bg-zinc-50 px-4 py-8\">
      <div className=\"max-w-xl mx-auto py-8\">
        <h1 className=\"text-2xl font-bold mb-2\">Become a Vendor</h1>
        <p className=\"text-sm text-zinc-600 mb-6\">
          Create your vendor account, then we’ll take you to your dashboard to finish onboarding.
        </p>
        <form onSubmit={handleSubmit} className=\"space-y-6 bg-white rounded-2xl shadow-sm p-6\">
          <div>
            <label htmlFor=\"businessName\" className=\"block text-sm font-medium mb-1\">
              Business Name
            </label>
            <input
              id=\"businessName\"
              name=\"businessName\"
              type=\"text\"
              required
              className=\"w-full border rounded px-3 py-2 text-sm\"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor=\"description\" className=\"block text-sm font-medium mb-1\">
              Description (optional)
            </label>
            <textarea
              id=\"description\"
              name=\"description\"
              rows={3}
              className=\"w-full border rounded px-3 py-2 text-sm\"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {message && <p className=\"text-xs text-zinc-600\">{message}</p>}
          <button
            type=\"submit\"
            disabled={submitting}
            className=\"w-full bg-primary text-white font-semibold py-3 rounded disabled:opacity-60\"
          >
            {submitting ? \"Creating vendor...\" : \"Create vendor account\"}
          </button>
        </form>
      </div>
    </div>
  );
}
