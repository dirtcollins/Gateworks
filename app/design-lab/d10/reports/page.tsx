import type { Metadata } from "next";
import { fetchReportData } from "@/lib/reports-data";
import { D10Reports } from "@/features/design-lab/d10/reports";

export const metadata: Metadata = {
  title: "Design Lab — Signal / Reports",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function D10ReportsPage() {
  const data = await fetchReportData();
  return <D10Reports data={data} />;
}
