/**
 * Tiny browser-only API cache for user-scoped GET requests.
 *
 * It keeps data in memory only, so authenticated data is never persisted to disk
 * and a page refresh naturally starts from a clean cache. The cache also
 * deduplicates simultaneous requests to the same endpoint.
 */
export class ApiResponseError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.payload = payload;
  }
}

interface ApiCacheEntry<T> {
  expiresAt: number;
  value: T;
}

interface ApiGetOptions extends Omit<RequestInit, "method" | "body"> {
  ttlMs?: number;
  forceRefresh?: boolean;
}

const DEFAULT_TTL_MS = 15_000;
const memoryCache = new Map<string, ApiCacheEntry<unknown>>();
const pendingRequests = new Map<string, Promise<unknown>>();

function now() {
  return Date.now();
}

function getCacheKey(input: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  const headerKey = Array.from(headers.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

  return `${input}::${headerKey}`;
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const message = (payload as { error?: unknown }).error;
    if (typeof message === "string" && message.trim()) return message;
  }

  return fallback;
}

export async function apiGetJson<T>(input: string, options: ApiGetOptions = {}): Promise<T> {
  const { ttlMs = DEFAULT_TTL_MS, forceRefresh = false, ...init } = options;
  const key = getCacheKey(input, init);
  const cached = memoryCache.get(key) as ApiCacheEntry<T> | undefined;

  if (!forceRefresh && cached && cached.expiresAt > now()) {
    return cached.value;
  }

  const pending = pendingRequests.get(key) as Promise<T> | undefined;
  if (!forceRefresh && pending) return pending;

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const request = fetch(input, {
    ...init,
    method: "GET",
    headers,
  })
    .then(async (response) => {
      const payload = await parseJsonSafely(response);

      if (!response.ok) {
        throw new ApiResponseError(
          getErrorMessage(payload, `요청에 실패했어요. (${response.status})`),
          response.status,
          payload,
        );
      }

      memoryCache.set(key, {
        value: payload as T,
        expiresAt: now() + ttlMs,
      });

      return payload as T;
    })
    .catch((error) => {
      if (cached) return cached.value;
      throw error;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
}

export function invalidateApiCache(match?: string | RegExp) {
  if (!match) {
    memoryCache.clear();
    pendingRequests.clear();
    return;
  }

  const shouldDelete = (key: string) => {
    if (typeof match === "string") return key.startsWith(match);
    return match.test(key);
  };

  for (const key of memoryCache.keys()) {
    if (shouldDelete(key)) memoryCache.delete(key);
  }

  for (const key of pendingRequests.keys()) {
    if (shouldDelete(key)) pendingRequests.delete(key);
  }
}
