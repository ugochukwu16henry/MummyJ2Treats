"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function VendorSignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [openDays, setOpenDays] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [hasCertificate, setHasCertificate] = useState(false);
  const [certificateDetails, setCertificateDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
    const [loggedIn, setLoggedIn] = useState<boolean>(true);

    // Check login status on mount
    useEffect(() => {
      fetch(`${API_BASE}/auth/me`, { credentials: "include" })
        .then((res) => {
          if (!res.ok) setLoggedIn(false);
        })
        .catch(() => setLoggedIn(false));
    }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    if (!businessName.trim() || !firstName.trim() || !lastName.trim() || !email.trim()) {
      setMessage("Business name, first name, last name, and email are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/become-vendor`, {
        method: "POST",
        credentials: "include",
      });
      if (res.status === 401) {
        setMessage("Please log in first to become a vendor.");
        router.push("/auth/login");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setMessage(body.message ?? "Could not create vendor account.");
        return;
      }

      await fetch(`${API_BASE}/vendors/me/branding`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          description: description.trim() || undefined,
        }),
      }).catch(() => {});

      // Extra profile info for founder admin review
      await fetch(`${API_BASE}/vendors/me/profile-extra`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerFirstName: firstName.trim() || undefined,
          ownerLastName: lastName.trim() || undefined,
          contactEmail: email.trim() || undefined,
          contactPhone: phone.trim() || undefined,
          country: country.trim() || undefined,
          state: state.trim() || undefined,
          city: city.trim() || undefined,
          openDays: openDays.trim() || undefined,
          openTime: openTime.trim() || undefined,
          closeTime: closeTime.trim() || undefined,
          hasCertificate,
          certificateDetails: certificateDetails.trim() || undefined,
        }),
      }).catch(() => {});

      router.push("/dashboard/vendor");
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen bg-zinc-50 px-4 py-8">
      <div className="max-w-xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-2">Become a Vendor</h1>
        <p className="text-sm text-zinc-600 mb-6">
          Share a few details about you and your business. The founder admin will review and approve your profile before products go fully live.
        </p>
          {!loggedIn ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg mb-6">
              You must be logged in to become a vendor. <a href="/auth/login" className="underline">Log in</a> first.
            </div>
          ) : (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First name *
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full border rounded px-3 py-2 text-sm"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last name *
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full border rounded px-3 py-2 text-sm"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border rounded px-3 py-2 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full border rounded px-3 py-2 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium mb-1">
              Business Name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              required
              className="w-full border rounded px-3 py-2 text-sm"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full border rounded px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="country" className="block text-sm font-medium mb-1">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium mb-1">
                State
              </label>
              <input
                id="state"
                name="state"
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium mb-1">
                City
              </label>
              <input
                id="city"
                name="city"
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="openDays" className="block text-sm font-medium mb-1">
              Days opened
            </label>
            <input
              id="openDays"
              name="openDays"
              type="text"
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="E.g. Monday–Saturday"
              value={openDays}
              onChange={(e) => setOpenDays(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="openTime" className="block text-sm font-medium mb-1">
                Opening time
              </label>
              <input
                id="openTime"
                name="openTime"
                type="time"
                className="w-full border rounded px-3 py-2 text-sm"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="closeTime" className="block text-sm font-medium mb-1">
                Closing time
              </label>
              <input
                id="closeTime"
                name="closeTime"
                type="time"
                className="w-full border rounded px-3 py-2 text-sm"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium mb-1">
              Cooking certificate or training
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasCertificate}
                onChange={(e) => setHasCertificate(e.target.checked)}
              />
              I have a food/cooking certificate or formal training.
            </label>
            {hasCertificate && (
              <textarea
                id="certificateDetails"
                name="certificateDetails"
                rows={2}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="Share a few details about your certificate or training."
                value={certificateDetails}
                onChange={(e) => setCertificateDetails(e.target.value)}
              />
            )}
          </div>
          {message && <p className="text-xs text-zinc-600">{message}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-white font-semibold py-3 rounded disabled:opacity-60"
          >
            {submitting ? "Creating vendor..." : "Create vendor account"}
          </button>
        </form>
          )}
      </div>
    </div>
  );
}