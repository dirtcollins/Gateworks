// Decides whether an /admin/* route gets the full operations-console shell
// (sidebar nav) or renders bare. The auth surfaces — /admin/login and
// /admin/access-denied — are public and must not display the admin sidebar,
// so they render their children directly.
"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { WayfinderAdminShell } from "@/features/sites/wayfinder/admin/admin-shell";

// Paths that render without the admin shell. Kept in sync with the public
// admin paths in middleware.ts.
const BARE_ADMIN_PATHS = new Set(["/admin/login", "/admin/access-denied"]);

export function AdminLayoutChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/admin";

  if (BARE_ADMIN_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  return <WayfinderAdminShell>{children}</WayfinderAdminShell>;
}
