// Wayfinder admin — order detail route.
import { WayfinderOrderDetail } from "@/features/sites/wayfinder/admin/order-detail";

type OrderDetailRouteProps = {
  params: Promise<{ orderId: string }>;
};

export const metadata = {
  title: "Order detail"
};

export default async function WayfinderAdminOrderDetailPage({
  params
}: OrderDetailRouteProps) {
  const { orderId } = await params;
  return <WayfinderOrderDetail orderId={decodeURIComponent(orderId)} />;
}
