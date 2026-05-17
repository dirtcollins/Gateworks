import type { Metadata } from "next";
import { fetchReportData } from "@/lib/reports-data";
import { D11Reports } from "@/features/design-lab/d11/reports";

export const metadata: Metadata = {
  title: "Design Lab — Wayfinder / Reports",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function D11ReportsPage() {
  const data = await fetchReportData();
  return <D11Reports data={data} />;
}
