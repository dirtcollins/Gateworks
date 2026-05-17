import type { Metadata } from "next";
import { LedgerAdminOrders } from "@/features/sites/ledger/admin/admin-orders";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default function LedgerAdminOrdersPage() {
  return <LedgerAdminOrders />;
}
