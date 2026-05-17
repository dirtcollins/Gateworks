import { fetchReportData } from "@/lib/reports-data";
import { IndustrialAdminDashboard } from "@/features/sites/industrial/admin/dashboard";

export const metadata = {
  title: "Dashboard"
};

export const dynamic = "force-dynamic";

export default async function IndustrialAdminDashboardPage() {
  const data = await fetchReportData();

  return <IndustrialAdminDashboard data={data} />;
}
