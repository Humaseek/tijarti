/**
 * SSR-safe localStorage helpers. Used by the Track F/G/H feature pages
 * (notes, tags, documents, contracts, licenses, etc.) that persist data
 * outside of the main store.
 */

export function lsRead<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsWrite<T>(key: string, value: T): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function lsRemove(key: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Generate a short random id (lowercase alphanum). */
export function rid(prefix = ""): string {
  const s = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${s}` : s;
}
