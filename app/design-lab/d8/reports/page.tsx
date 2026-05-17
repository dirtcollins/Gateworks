import type { Metadata } from "next";
import { fetchReportData } from "@/lib/reports-data";
import { D8Reports } from "@/features/design-lab/d8/reports";

export const metadata: Metadata = {
  title: "Design Lab — Blueprint / Reports",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function D8ReportsPage() {
  const data = await fetchReportData();
  return <D8Reports data={data} />;
}
