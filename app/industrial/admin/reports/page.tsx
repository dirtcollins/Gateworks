import { fetchReportData } from "@/lib/reports-data";
import { IndustrialAdminReports } from "@/features/sites/industrial/admin/reports";

export const metadata = {
  title: "Reports"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminReportsPage() {
  const data = await fetchReportData();

  return <IndustrialAdminReports data={data} />;
}
