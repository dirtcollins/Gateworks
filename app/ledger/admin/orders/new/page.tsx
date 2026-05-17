import type { Metadata } from "next";
import { LedgerAdminNewOrder } from "@/features/sites/ledger/admin/admin-new-order";

export const metadata: Metadata = { title: "New order" };
export const dynamic = "force-dynamic";

export default function LedgerAdminNewOrderPage() {
  return <LedgerAdminNewOrder />;
}
