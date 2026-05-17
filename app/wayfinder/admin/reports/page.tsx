// Wayfinder admin — reports route. Async server component: calls the
// server-only fetchReportData() (Supabase aggregates) and passes the
// serializable ReportData to the presentational client component.
import { WayfinderReports } from "@/features/sites/wayfinder/admin/reports";
import { fetchReportData } from "@/lib/reports-data";

export const metadata = {
  title: "Reports"
};

export const dynamic = "force-dynamic";

export default async function WayfinderAdminReportsPage() {
  const data = await fetchReportData();
  return <WayfinderReports data={data} />;
}
