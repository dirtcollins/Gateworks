import type { Metadata } from "next";
import { fetchReportData } from "@/lib/reports-data";
import { D6Reports } from "@/features/design-lab/d6/reports";

export const metadata: Metadata = { title: "Design Lab — Apex / Reports" };

export const dynamic = "force-dynamic";

export default async function D6ReportsPage() {
  const data = await fetchReportData();
  return <D6Reports data={data} />;
}
