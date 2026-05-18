// Wayfinder admin — procurement (supplier PO) detail route.
import { WayfinderProcurementDetail } from "@/features/sites/wayfinder/admin/procurement-detail";

type ProcurementDetailRouteProps = {
  params: Promise<{ poId: string }>;
};

export const metadata = {
  title: "Purchase order"
};

export default async function WayfinderAdminProcurementDetailPage({
  params
}: ProcurementDetailRouteProps) {
  const { poId } = await params;
  return <WayfinderProcurementDetail poId={decodeURIComponent(poId)} />;
}
