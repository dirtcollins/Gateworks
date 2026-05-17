import type { Metadata } from "next";
import { D2Reports } from "@/features/design-lab/d2/reports";
import { fetchReportData } from "@/lib/reports-data";

export const metadata: Metadata = {
  title: "Design Lab — D2 Warehouse Dark · Reports"
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await fetchReportData();
  return <D2Reports data={data} />;
}
