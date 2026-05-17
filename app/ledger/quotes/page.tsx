import type { Metadata } from "next";
import { LedgerQuotesView } from "@/features/sites/ledger/quotes";

export const metadata: Metadata = { title: "Quotes" };
export const dynamic = "force-dynamic";

export default function LedgerQuotesPage() {
  return <LedgerQuotesView />;
}
