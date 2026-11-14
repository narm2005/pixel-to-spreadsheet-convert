// Small client for the SlickReceipts FastAPI backend (replaces the Supabase client).
export const API_URL = (import.meta.env.VITE_API_URL || "https://receipt2xcl.onrender.com").replace(/\/$/, "");

const TOKEN_KEY = "sr_session";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode: session lasts for this tab only */
  }
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      /* not JSON */
    }
    if (res.status === 401) {
      setToken(null);
      window.dispatchEvent(new Event("sr-signed-out"));
    }
    throw new ApiError(res.status, message);
  }
  return res;
}

export const api = {
  get: async <T = any>(path: string): Promise<T> => (await request(path)).json(),
  post: async <T = any>(path: string, body: unknown): Promise<T> =>
    (await request(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })).json(),
  upload: async <T = any>(path: string, form: FormData): Promise<T> =>
    (await request(path, { method: "POST", body: form })).json(),
  delete: async <T = any>(path: string): Promise<T> => (await request(path, { method: "DELETE" })).json(),
  // Downloads a file the backend generates (CSV / Excel / JSON) and saves it.
  download: async (path: string, fallbackName: string) => {
    const res = await request(path);
    const blob = await res.blob();
    const match = /filename="?([^"]+)"?/.exec(res.headers.get("Content-Disposition") || "");
    const name = match?.[1] || fallbackName;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
