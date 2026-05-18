"use client";

import type { ReactNode } from "react";

type RootShellProps = {
  children: ReactNode;
};

// Legacy app chrome is fully retired. The storefront (app/(site)/) and the
// admin back-office each ship their own complete layout, so RootShell is a
// pass-through. Retained only to avoid touching any stale imports; safe to
// delete in a later cleanup wave.
export function RootShell({ children }: RootShellProps) {
  return <>{children}</>;
}
