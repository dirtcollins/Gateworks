import type { Metadata } from "next";
import { LedgerAdminPurchaseOrders } from "@/features/sites/ledger/admin/admin-purchase-orders";

export const metadata: Metadata = { title: "Customer POs" };
export const dynamic = "force-dynamic";

export default function LedgerAdminPurchaseOrdersPage() {
  return <LedgerAdminPurchaseOrders />;
}
