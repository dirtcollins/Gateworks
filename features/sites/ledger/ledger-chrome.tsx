"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LedgerFooter, LedgerHeader } from "@/features/sites/ledger/kit";

/* Wraps Ledger pages with the storefront header/footer — except the
 * /ledger/admin/* operations area, which provides its own admin shell
 * chrome and should render full-bleed. */
export function LedgerChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/ledger";
  const isAdmin = pathname.startsWith("/ledger/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <LedgerHeader />
      {children}
      <LedgerFooter />
    </>
  );
}
