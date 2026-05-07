"use client";

export function makeScopedStoreName(baseName: string, userId: string) {
  return `${baseName}:${userId || "guest"}`;
}

export function readScopedPersistedState<T>(
  baseName: string,
  userId: string,
  fallback: () => T
) {
  if (typeof window === "undefined") {
    return fallback();
  }

  const scopedName = makeScopedStoreName(baseName, userId);
  const hasScopedState = Boolean(window.localStorage.getItem(scopedName));
  const storageKey = hasScopedState || userId !== "guest" ? scopedName : baseName;
  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return fallback();
  }

  try {
    const parsed = JSON.parse(rawValue) as { state?: Partial<T> };
    return { ...fallback(), ...parsed.state };
  } catch {
    return fallback();
  }
}
