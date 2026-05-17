import { OrderDetailPage } from "@/features/admin/orders/order-detail-page";
import { products as fallbackCatalogProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Create Order | Gateworks Operations"
};

export const dynamic = "force-dynamic";

export default async function AdminCreateOrderPage() {
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackCatalogProducts;

  return (
    <OrderDetailPage
      backHref="/admin/orders"
      catalogProducts={catalogProducts}
      createMode
      orderId={`order-draft-${Date.now()}`}
    />
  );
}
