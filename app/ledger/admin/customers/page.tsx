import type { Metadata } from "next";
import { LedgerAdminCustomers } from "@/features/sites/ledger/admin/admin-customers";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default function LedgerAdminCustomersPage() {
  return <LedgerAdminCustomers />;
}
