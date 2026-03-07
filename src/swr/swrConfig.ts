import type { SWRConfiguration } from 'swr';
import { fetcher } from './fetcher';

export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: false,
  dedupingInterval: 1000,
  shouldRetryOnError: false,
  errorRetryCount: 0,
};
