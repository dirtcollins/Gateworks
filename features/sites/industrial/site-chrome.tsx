"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IndustrialFooter, IndustrialHeader } from "@/features/sites/industrial/kit";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — site chrome wrapper. Renders the storefront
 * header/footer for shopper-facing routes, but suppresses them under
 * /industrial/admin so the admin shell can supply its own chrome.
 * ------------------------------------------------------------------ */
export function IndustrialSiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/industrial/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <IndustrialHeader />
      {children}
      <IndustrialFooter />
    </>
  );
}
