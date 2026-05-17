import { OrderDetailPage } from "@/features/admin/orders/order-detail-page";
import { products as fallbackCatalogProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

type AdminOrderDetailPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

export const metadata = {
  title: "Order Detail | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params
}: AdminOrderDetailPageProps) {
  const { orderId } = await params;
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackCatalogProducts;

  return (
    <OrderDetailPage
      backHref="/admin/orders"
      catalogProducts={catalogProducts}
      orderId={orderId}
    />
  );
}
