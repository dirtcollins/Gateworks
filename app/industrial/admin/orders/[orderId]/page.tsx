import { IndustrialAdminOrderDetail } from "@/features/sites/industrial/admin/order-detail";

export const metadata = {
  title: "Order detail"
};

type IndustrialAdminOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function IndustrialAdminOrderDetailPage({
  params
}: IndustrialAdminOrderDetailPageProps) {
  const { orderId } = await params;

  return <IndustrialAdminOrderDetail orderId={orderId} />;
}
