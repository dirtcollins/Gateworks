import { WayfinderInvoiceDetail } from "@/features/sites/wayfinder/admin/invoice-detail";

type InvoiceDetailRouteProps = {
  params: Promise<{ invoiceId: string }>;
};

export const metadata = {
  title: "Invoice detail - Gateworks Admin"
};

export default async function InvoiceDetailPage({
  params
}: InvoiceDetailRouteProps) {
  const { invoiceId } = await params;
  return <WayfinderInvoiceDetail invoiceId={decodeURIComponent(invoiceId)} />;
}
