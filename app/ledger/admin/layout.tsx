import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { LedgerAdminShell } from "@/features/sites/ledger/admin/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Operations | Ledger",
    template: "%s | Ledger Operations"
  },
  description:
    "Ledger operations workspace — orders, quotes, and financial reporting for the Gateworks procurement portal."
};

export default function LedgerAdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <LedgerAdminShell>{children}</LedgerAdminShell>
    </Suspense>
  );
}
