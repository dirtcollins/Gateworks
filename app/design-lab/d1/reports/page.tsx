import type { Metadata } from "next";
import { D1Reports } from "@/features/design-lab/d1/reports";
import { fetchReportData } from "@/lib/reports-data";

export const metadata: Metadata = {
  title: "Design Lab — Concept 1 / Reports"
};

export const dynamic = "force-dynamic";

export default async function D1ReportsPage() {
  const data = await fetchReportData();
  return <D1Reports data={data} />;
}
