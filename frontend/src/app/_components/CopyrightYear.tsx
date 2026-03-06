"use client";

import { useState, useEffect } from "react";

/**
 * Renders the current year only on the client to avoid hydration mismatch
 * (server and client can differ at year boundary or due to timezone).
 */
export function CopyrightYear() {
  const [year, setYear] = useState<number | null>(null);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return <span className="inline-block min-w-[2.5ch]">{year ?? "\u00A0"}</span>;
}
