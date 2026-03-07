import { buildUrl } from './config';
import { getToken } from './auth';

export class HttpError extends Error {
  status: number;
  info?: unknown;

  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.info = info;
  }
}

export async function fetcher<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const url = typeof input === 'string' ? buildUrl(input) : input;
  const token = getToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message = typeof data === 'string' && data ? data : res.statusText;
    throw new HttpError(message || 'Request failed', res.status, data);
  }

  return data as T;
}
