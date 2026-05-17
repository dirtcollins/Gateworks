import type { Metadata } from "next";
import { LedgerAdminOrderDetail } from "@/features/sites/ledger/admin/admin-order-detail";

export const metadata: Metadata = { title: "Order detail" };
export const dynamic = "force-dynamic";

type LedgerAdminOrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function LedgerAdminOrderDetailPage({
  params
}: LedgerAdminOrderDetailPageProps) {
  const { orderId } = await params;
  return <LedgerAdminOrderDetail orderId={decodeURIComponent(orderId)} />;
}
