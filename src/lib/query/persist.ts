import type { LifeOSData } from "@/contexts/lifeos-context";

const STORAGE_KEY = "lifeos-v1";
const TTL_MS = 5 * 60_000;

type Persisted = { data: LifeOSData; expires: number };

export function readPersistedLifeOS(): LifeOSData | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Persisted;
    if (parsed.expires > Date.now()) return parsed.data;
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore corrupt cache */
  }
  return undefined;
}

export function writePersistedLifeOS(data: LifeOSData) {
  if (typeof window === "undefined") return;
  try {
    const payload: Persisted = { data, expires: Date.now() + TTL_MS };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota exceeded — skip */
  }
}
