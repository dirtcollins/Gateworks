// Wayfinder admin — procurement (supplier PO) list route.
import { WayfinderProcurementList } from "@/features/sites/wayfinder/admin/procurement-list";

export const metadata = {
  title: "Procurement"
};

export default function WayfinderAdminProcurementPage() {
  return <WayfinderProcurementList />;
}
