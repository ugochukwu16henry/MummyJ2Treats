import { API_BASE } from "./apiBase";

type ApiFetchResult = {
  response: Response;
  triedUrls: string[];
  usedBase: string;
};

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function toggleApiSegment(baseUrl: string): string | null {
  try {
    const parsed = new URL(baseUrl);
    const pathname = parsed.pathname.replace(/\/+$/, "");

    if (pathname.toLowerCase().endsWith("/api")) {
      parsed.pathname = pathname.slice(0, -4) || "/";
      return `${parsed.origin}${parsed.pathname === "/" ? "" : parsed.pathname}`;
    }

    parsed.pathname = `${pathname}/api`;
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return null;
  }
}

export function getApiBaseCandidates(): string[] {
  const candidates: string[] = [];
  const primary = API_BASE.replace(/\/+$/, "");
  if (primary) candidates.push(primary);

  const toggled = toggleApiSegment(primary);
  if (toggled && toggled !== primary) {
    candidates.push(toggled);
  }

  return candidates;
}

export async function apiFetch(path: string, init?: RequestInit): Promise<ApiFetchResult> {
  const normalizedPath = normalizePath(path);
  const bases = getApiBaseCandidates();
  const triedUrls: string[] = [];
  let last404: Response | null = null;
  let lastError: unknown = null;

  for (const base of bases) {
    const url = `${base}${normalizedPath}`;
    triedUrls.push(url);
    try {
      const response = await fetch(url, init);
      if (response.status === 404) {
        last404 = response;
        continue;
      }
      return { response, triedUrls, usedBase: base };
    } catch (err) {
      lastError = err;
    }
  }

  if (last404) {
    return { response: last404, triedUrls, usedBase: bases[bases.length - 1] ?? API_BASE };
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to reach API.");
}
