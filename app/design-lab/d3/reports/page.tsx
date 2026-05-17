import type { Metadata } from "next";
import { D3Reports } from "@/features/design-lab/d3/reports";
import { fetchReportData } from "@/lib/reports-data";

export const metadata: Metadata = {
  title: "Design 3 — Editorial Catalog · Reports"
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await fetchReportData();
  return <D3Reports data={data} />;
}
