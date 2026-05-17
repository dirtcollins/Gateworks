import type { Metadata } from "next";
import { LedgerCheckoutView } from "@/features/sites/ledger/checkout";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default function LedgerCheckoutPage() {
  return <LedgerCheckoutView />;
}
