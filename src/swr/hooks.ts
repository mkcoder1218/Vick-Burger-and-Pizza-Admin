import useSWR, { mutate } from 'swr';
import { fetcher } from './fetcher';

export type Id = string | number;
export type Query = Record<string, string | number | boolean | undefined | null>;
export type QueryLike = Query | {};

function toQuery(params?: QueryLike) {
  if (!params) return '';
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return '';
  const q = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
  return `?${q}`;
}

export function listKey(resource: string, params?: QueryLike) {
  return [resource, params ?? null] as const;
}

export function getKey(resource: string, id: Id) {
  return [resource, id] as const;
}

export function useGetAll<T>(resource: string | null, params?: QueryLike) {
  return useSWR<T>(resource ? listKey(resource, params) : null, ([res, p]) => fetcher(`/${res}${toQuery(p ?? undefined)}`));
}

export function useGetOne<T>(resource: string, id?: Id) {
  return useSWR<T>(id == null ? null : getKey(resource, id), ([res, theId]) => fetcher(`/${res}/${theId}`));
}

export async function createOne<T>(resource: string, payload: unknown) {
  const data = await fetcher<T>(`/${resource}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  await mutate((key) => Array.isArray(key) && key[0] === resource);
  return data;
}

export async function updateOne<T>(resource: string, id: Id, payload: unknown) {
  const data = await fetcher<T>(`/${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  await mutate((key) => Array.isArray(key) && key[0] === resource);
  return data;
}

export async function deleteOne<T>(resource: string, id: Id) {
  const data = await fetcher<T>(`/${resource}/${id}`, {
    method: 'DELETE',
  });
  await mutate((key) => Array.isArray(key) && key[0] === resource);
  return data;
}
