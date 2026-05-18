// Wayfinder admin — registered site-user directory helper. Wraps the
// /api/site-users route so admin surfaces (quotes, customers) can list the
// people who actually registered accounts, not just the static directory.
"use client";

export type SiteUser = {
  id: string;
  displayName: string;
  lastUsedAt: string;
};

export async function fetchSiteUsers(): Promise<{
  users: SiteUser[];
  configured: boolean;
}> {
  try {
    const response = await fetch("/api/site-users", { cache: "no-store" });
    if (!response.ok) return { users: [], configured: false };
    const payload = (await response.json()) as {
      users?: SiteUser[];
      reason?: string;
    };
    return { users: payload.users ?? [], configured: true };
  } catch {
    return { users: [], configured: false };
  }
}
