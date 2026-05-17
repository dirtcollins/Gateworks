import type { Metadata } from "next";
import { LedgerCartView } from "@/features/sites/ledger/cart";

export const metadata: Metadata = { title: "Purchase order" };
export const dynamic = "force-dynamic";

export default function LedgerCartPage() {
  return <LedgerCartView />;
}
