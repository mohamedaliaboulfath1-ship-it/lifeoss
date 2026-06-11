type CacheEntry<T> = { data: T; expires: number };

const store = new Map<string, CacheEntry<unknown>>();

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 30_000
): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expires > Date.now()) return hit.data;
  const data = await fetcher();
  store.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k);
  }
}
