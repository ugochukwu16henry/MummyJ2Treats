const DEFAULT_API_BASE = "http://localhost:5134/api";

function normalizePath(pathname: string): string {
  const cleaned = pathname
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/auth\/login$/i, "");

  return cleaned;
}

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_API_BASE;

  try {
    const url = new URL(trimmed);
    const normalizedPath = normalizePath(url.pathname);
    return `${url.origin}${normalizedPath}`;
  } catch {
    // Fallback for values like localhost:5134 or relative paths.
    const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`;

    try {
      const url = new URL(withProtocol);
      const normalizedPath = normalizePath(url.pathname);
      return `${url.origin}${normalizedPath}`;
    } catch {
      return DEFAULT_API_BASE;
    }
  }
}

export const API_BASE = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE);
