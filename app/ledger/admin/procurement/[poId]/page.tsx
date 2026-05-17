import type { Metadata } from "next";
import { LedgerAdminProcurementDetail } from "@/features/sites/ledger/admin/admin-procurement-detail";

export const metadata: Metadata = { title: "Supplier PO" };
export const dynamic = "force-dynamic";

type LedgerAdminProcurementDetailPageProps = {
  params: Promise<{ poId: string }>;
};

export default async function LedgerAdminProcurementDetailPage({
  params
}: LedgerAdminProcurementDetailPageProps) {
  const { poId } = await params;
  return <LedgerAdminProcurementDetail poId={decodeURIComponent(poId)} />;
}
