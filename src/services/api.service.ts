/**
 * Base API client — all frontend service calls go through this module.
 *
 * Auth0 access tokens are fetched on-demand via a TokenGetter function
 * injected by AuthContext. The Auth0 SDK caches tokens client-side and
 * silently refreshes them before expiry, so calling the getter on every
 * request is safe and adds no measurable latency on cache hits.
 *
 * Public routes (no JWT required) still pass through cleanly — when no
 * user is logged in, getToken() returns null and the header is omitted.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// ── Token getter ──────────────────────────────────────────────────────────────

type TokenGetter = () => Promise<string | null>;
let _tokenGetter: TokenGetter | null = null;

/** Called by AuthContext after Auth0 login to wire up the access-token source. */
export function setTokenGetter(fn: TokenGetter) {
  _tokenGetter = fn;
}

/** Called by AuthContext on logout to stop attaching tokens. */
export function clearTokenGetter() {
  _tokenGetter = null;
}

async function getToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (!_tokenGetter) return null;
  try {
    return await _tokenGetter();
  } catch {
    return null;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T | null;
  error: string | null;
};

// ── Core fetch ────────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit & { body?: unknown } = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();
  const body = options.body;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (body && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return { data: null, error: null };

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        data: null,
        error: json?.message ?? json?.error ?? `Error ${res.status}`,
      };
    }

    const payload = "data" in json ? json.data : json;
    return { data: payload as T, error: null };
  } catch (err: any) {
    return { data: null, error: err?.message ?? "Network error" };
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body } as RequestInit & { body: unknown }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body } as RequestInit & { body: unknown }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body } as RequestInit & { body: unknown }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, body: FormData) => request<T>(path, { method: "POST", body }),
};
