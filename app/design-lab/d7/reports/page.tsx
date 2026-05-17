import type { Metadata } from "next";
import { fetchReportData } from "@/lib/reports-data";
import { D7Reports } from "@/features/design-lab/d7/reports";

export const metadata: Metadata = { title: "Design Lab — Ledger / Reports" };

export const dynamic = "force-dynamic";

export default async function D7ReportsPage() {
  const data = await fetchReportData();
  return <D7Reports data={data} />;
}
