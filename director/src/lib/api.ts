export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit & { signal?: AbortSignal }
): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? `Request failed: ${res.status}`);
  }

  return res.json();
}

export function apiUpload<T>(path: string, formData: FormData, signal?: AbortSignal): Promise<T> {
  // Don't set Content-Type — browser sets multipart boundary automatically
  return fetch(path, { method: 'POST', body: formData, signal }).then(async (res) => {
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new ApiError(res.status, body.error ?? `Upload failed: ${res.status}`);
    }
    return res.json();
  });
}
