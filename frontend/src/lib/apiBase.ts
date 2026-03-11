const DEFAULT_API_BASE = "http://localhost:5134/api";

function normalizePathToApi(pathname: string): string {
  const cleaned = pathname
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/auth\/login$/i, "");

  const segments = cleaned.split("/").filter(Boolean);
  const apiIndex = segments.findIndex((segment) => segment.toLowerCase() === "api");

  if (apiIndex >= 0) {
    return `/${segments.slice(0, apiIndex + 1).join("/")}`;
  }

  return "/api";
}

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, "");
  if (!trimmed) return DEFAULT_API_BASE;

  try {
    const url = new URL(trimmed);
    const normalizedPath = normalizePathToApi(url.pathname);
    return `${url.origin}${normalizedPath}`;
  } catch {
    // Fallback for values like localhost:5134 or relative paths.
    const withProtocol = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `http://${trimmed}`;

    try {
      const url = new URL(withProtocol);
      const normalizedPath = normalizePathToApi(url.pathname);
      return `${url.origin}${normalizedPath}`;
    } catch {
      return DEFAULT_API_BASE;
    }
  }
}

export const API_BASE = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE);
