import { useSyncExternalStore } from "react";

const PREFIX = "find-tu:";
const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readStored<T>(key: string, fallback: T): T {
  const raw = storage()?.getItem(PREFIX + key) ?? null;
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

export function writeStored<T>(key: string, value: T) {
  try {
    storage()?.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Private mode or full storage: the mock keeps working for this page view.
  }
  cache.set(key, { raw: JSON.stringify(value), value });
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, listener: () => void) {
  const set = listeners.get(key) ?? new Set();
  set.add(listener);
  listeners.set(key, set);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PREFIX + key) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    set.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** A stored value that re-renders on change. `null` while prerendering. */
export function useStored<T>(key: string, fallback: T): T | null {
  return useSyncExternalStore(
    (listener) => subscribe(key, listener),
    () => readStored(key, fallback),
    () => null,
  );
}

export function latency(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Add `?fail=<area>` to a URL to see an area's error state. */
export function shouldFail(area: string): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search)
    .getAll("fail")
    .includes(area);
}

export function newId(length = 8): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, length);
}
