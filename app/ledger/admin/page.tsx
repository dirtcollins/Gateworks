import type { Metadata } from "next";
import { LedgerAdminDashboard } from "@/features/sites/ledger/admin/admin-dashboard";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default function LedgerAdminDashboardPage() {
  return <LedgerAdminDashboard />;
}
