const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function buildHeaders(options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: buildHeaders(options),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || "Network request failed");
  }
  return body;
}

export async function authFetch(path: string, token: string, options: RequestInit = {}) {
  const headers = buildHeaders(options);
  headers.set("Authorization", `Bearer ${token}`);
  return apiFetch(path, { ...options, headers });
}
