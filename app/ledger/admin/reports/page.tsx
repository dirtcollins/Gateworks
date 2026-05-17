import type { Metadata } from "next";
import { fetchReportData } from "@/lib/reports-data";
import { LedgerAdminReports } from "@/features/sites/ledger/admin/admin-reports";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

export default async function LedgerAdminReportsPage() {
  const data = await fetchReportData();
  return <LedgerAdminReports data={data} />;
}
