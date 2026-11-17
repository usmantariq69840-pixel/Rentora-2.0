/**
 * Tiny fetch wrapper for the local Express API.
 * Requests go to /api/* and Vite proxies them to http://localhost:3001.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields?: { path: string; message: string }[],
    /** Machine-readable reason from the server, e.g. 'not_configured' for AI without a key */
    public code?: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Request failed', data.fields, data.code);
  return data as T;
}
