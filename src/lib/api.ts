// Small client for the SlickReceipts FastAPI backend. Sign-in stays with Supabase; every request
// carries the Supabase access token, which the backend verifies.
import { supabase } from "@/integrations/supabase/client";

export const API_URL = (import.meta.env.VITE_API_URL || "https://receipt2xcl.onrender.com").replace(/\/$/, "");

const getToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession(); // refreshes the token when it is about to expire
  return data.session?.access_token ?? null;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function send(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let res = await send(path, init, await getToken());
  if (res.status === 401) {
    // The token may have just expired: refresh once and retry.
    const { data } = await supabase.auth.refreshSession();
    if (data.session) res = await send(path, init, data.session.access_token);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      /* not JSON */
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
  put: async <T = any>(path: string, body: unknown): Promise<T> =>
    (await request(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })).json(),
  patch: async <T = any>(path: string, body: unknown): Promise<T> =>
    (await request(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })).json(),
  delete: async <T = any>(path: string): Promise<T> => (await request(path, { method: "DELETE" })).json(),
  // Fetches a generated file without saving it, e.g. to share it from a phone.
  file: async (path: string, fallbackName: string): Promise<File> => {
    const res = await request(path);
    const blob = await res.blob();
    const match = /filename="?([^"]+)"?/.exec(res.headers.get("Content-Disposition") || "");
    return new File([blob], match?.[1] || fallbackName, { type: blob.type });
  },
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
