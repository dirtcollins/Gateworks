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

  if (isAdminRoute) {
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
