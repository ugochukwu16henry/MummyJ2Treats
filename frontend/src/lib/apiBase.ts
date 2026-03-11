const DEFAULT_API_BASE = "http://localhost:5134/api";

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_API_BASE;

  if (trimmed.endsWith("/api")) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

export const API_BASE = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE);
