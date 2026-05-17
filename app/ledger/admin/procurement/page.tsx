import type { Metadata } from "next";
import { LedgerAdminProcurement } from "@/features/sites/ledger/admin/admin-procurement";

export const metadata: Metadata = { title: "Procurement" };
export const dynamic = "force-dynamic";

export default function LedgerAdminProcurementPage() {
  return <LedgerAdminProcurement />;
}
