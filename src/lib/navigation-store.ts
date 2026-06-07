/** Client-side navigation memory: recents, favorites, search history */

const RECENTS_KEY = "lifeos-nav-recents";
const FAVORITES_KEY = "lifeos-nav-favorites";
const SEARCH_KEY = "lifeos-search-recents";
const MAX = 8;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export type NavRecent = { href: string; title: string; icon?: string; at: number };

export function trackPageVisit(href: string, title: string, icon?: string) {
  const list = read<NavRecent[]>(RECENTS_KEY, []);
  const next = [
    { href, title, icon, at: Date.now() },
    ...list.filter((r) => r.href !== href),
  ].slice(0, MAX);
  write(RECENTS_KEY, next);
}

export function getRecentPages() {
  return read<NavRecent[]>(RECENTS_KEY, []);
}

export function toggleFavorite(href: string, title: string, icon?: string) {
  const list = read<NavRecent[]>(FAVORITES_KEY, []);
  const exists = list.some((f) => f.href === href);
  const next = exists
    ? list.filter((f) => f.href !== href)
    : [{ href, title, icon, at: Date.now() }, ...list].slice(0, MAX);
  write(FAVORITES_KEY, next);
  return !exists;
}

export function getFavorites() {
  return read<NavRecent[]>(FAVORITES_KEY, []);
}

export function isFavorite(href: string) {
  return getFavorites().some((f) => f.href === href);
}

export function trackSearchQuery(q: string) {
  const trimmed = q.trim();
  if (trimmed.length < 2) return;
  const list = read<string[]>(SEARCH_KEY, []);
  write(SEARCH_KEY, [trimmed, ...list.filter((s) => s !== trimmed)].slice(0, MAX));
}

export function getRecentSearches() {
  return read<string[]>(SEARCH_KEY, []);
}
