import { products as fallbackProducts } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";
import { IndustrialAdminProcurementDetail } from "@/features/sites/industrial/admin/procurement-detail";

export const metadata = {
  title: "Purchase order"
};

export const dynamic = "force-dynamic";

type IndustrialAdminProcurementDetailPageProps = {
  params: Promise<{ poId: string }>;
};

export default async function IndustrialAdminProcurementDetailPage({
  params
}: IndustrialAdminProcurementDetailPageProps) {
  const { poId } = await params;
  const catalogProducts = (await fetchSupabaseProducts()) || fallbackProducts;

  return (
    <IndustrialAdminProcurementDetail
      catalogProducts={catalogProducts}
      poId={poId}
    />
  );
}
