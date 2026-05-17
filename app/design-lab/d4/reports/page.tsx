import type { Metadata } from "next";
import { D4Reports } from "@/features/design-lab/d4/reports";
import { fetchReportData } from "@/lib/reports-data";

export const metadata: Metadata = {
  title: "Design 4 — Reports",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await fetchReportData();
  return <D4Reports data={data} />;
}
