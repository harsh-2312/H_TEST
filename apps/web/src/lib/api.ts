const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function buildHeaders(options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  return headers;
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = sessionStorage.getItem("lc_refresh");
    if (!refreshToken) return null;
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.accessToken) {
      sessionStorage.setItem("lc_token", data.accessToken);
      return data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
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

  let response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
  });

  // Token expire hua — refresh karo
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      response = await fetch(`${API_URL}${path}`, {
        credentials: "include",
        ...options,
        headers,
      });
    } else {
      // Refresh bhi fail — logout
      sessionStorage.removeItem("lc_token");
      sessionStorage.removeItem("lc_refresh");
      sessionStorage.removeItem("lc_user");
      window.location.href = "/auth/login";
      throw new Error("Session expired. Please login again.");
    }
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error || "Network request failed");
  }
  return body;
}
