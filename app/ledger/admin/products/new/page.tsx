import type { Metadata } from "next";
import { LedgerAdminProductForm } from "@/features/sites/ledger/admin/admin-product-form";

export const metadata: Metadata = { title: "New product" };
export const dynamic = "force-dynamic";

export default function LedgerAdminNewProductPage() {
  return <LedgerAdminProductForm mode="create" />;
}
