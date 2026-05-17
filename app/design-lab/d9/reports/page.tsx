import type { Metadata } from "next";
import { fetchReportData } from "@/lib/reports-data";
import { D9Reports } from "@/features/design-lab/d9/reports";

export const metadata: Metadata = { title: "Design Lab — Showroom / Reports" };

export const dynamic = "force-dynamic";

export default async function D9ReportsPage() {
  const data = await fetchReportData();
  return <D9Reports data={data} />;
}
