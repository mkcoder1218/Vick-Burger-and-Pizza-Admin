export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export function buildUrl(path: string) {
  if (!API_BASE_URL) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
