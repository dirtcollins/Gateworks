import type { Metadata } from "next";
import { LedgerAdminQuotes } from "@/features/sites/ledger/admin/admin-quotes";

export const metadata: Metadata = { title: "Quotes" };
export const dynamic = "force-dynamic";

export default function LedgerAdminQuotesPage() {
  return <LedgerAdminQuotes />;
}
