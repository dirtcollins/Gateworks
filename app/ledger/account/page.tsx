import type { Metadata } from "next";
import { LedgerAccountView } from "@/features/sites/ledger/account";

export const metadata: Metadata = { title: "Account" };
export const dynamic = "force-dynamic";

export default function LedgerAccountPage() {
  return <LedgerAccountView />;
}
