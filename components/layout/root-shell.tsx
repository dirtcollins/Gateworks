"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type RootShellProps = {
  children: ReactNode;
};

export function RootShell({ children }: RootShellProps) {
  const pathname = usePathname() || "/";
  const isAdminRoute = pathname.startsWith("/admin");
  // Design Lab concepts each render their own full chrome — keep the app
  // sidebar and footer out of the demo (and out of the hub preview iframes).
  const isDesignLab = pathname.startsWith("/design-lab");

  if (isAdminRoute || isDesignLab) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-transparent text-industrial-ink lg:grid lg:grid-cols-[248px_minmax(0,1fr)] print:block">
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <div className="flex min-h-screen flex-col lg:max-h-screen lg:overflow-y-auto print:block print:min-h-0 print:max-h-none print:overflow-visible">
        <div className="flex-1">{children}</div>
        <div className="print:hidden">
          <SiteFooter />
        </div>
      </div>
    </div>
  );
}
