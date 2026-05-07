import { AdminDashboard } from "@/components/admin-dashboard";
import { products } from "@/lib/catalog";
import { fetchSupabaseProducts } from "@/lib/supabase-catalog";

export const metadata = {
  title: "Admin | Contractor Supply"
};

export default async function AdminPage() {
  const supabaseProducts = await fetchSupabaseProducts();

  return <AdminDashboard products={supabaseProducts || products} />;
}
