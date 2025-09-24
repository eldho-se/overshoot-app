export function getApiBase(): string {
  const envBase = (typeof process !== 'undefined' && (process.env as any)?.NEXT_PUBLIC_API_BASE) as string | undefined;
  return envBase && envBase.length > 0
    ? envBase.replace(/\/$/, '')
    : 'https://overshoot-server-961082160702.us-central1.run.app';
}

export function getAuthHeaders(): HeadersInit {
  const apiKey = (typeof process !== 'undefined' && (process.env as any)?.NEXT_PUBLIC_X_API_KEY) as string | undefined;
  return {
    'x-api-key': apiKey || '',
    Authorization: apiKey ? `Bearer ${apiKey}` : '',
  } as HeadersInit;
}

export async function fetchJson<T = any>(pathOrUrl: string, init?: RequestInit): Promise<T> {
  const isAbsolute = /^https?:\/\//i.test(pathOrUrl);
  const base = getApiBase();
  const url = isAbsolute ? pathOrUrl : `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;

  const defaultHeaders: HeadersInit = getAuthHeaders();
  const initHeaders = (init?.headers || {}) as Record<string, any>;

  const headers: HeadersInit = { ...defaultHeaders, ...initHeaders };

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let detail: string | undefined;
    try {
      const err = await res.json();
      detail = err?.detail || err?.message;
    } catch {}
    throw new Error(detail || `HTTP ${res.status} for ${url}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}
