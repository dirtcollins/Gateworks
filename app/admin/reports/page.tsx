import { ReportsDashboard } from "@/features/admin/reports/reports-dashboard";
import { fetchReportData } from "@/lib/reports-data";

export const metadata = {
  title: "Reports | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await fetchReportData();
  return <ReportsDashboard data={data} />;
}
