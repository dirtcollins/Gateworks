// Wayfinder admin — orders list route.
import { WayfinderOrdersList } from "@/features/sites/wayfinder/admin/orders-list";

export const metadata = {
  title: "Orders"
};

export default function WayfinderAdminOrdersPage() {
  return <WayfinderOrdersList />;
}
