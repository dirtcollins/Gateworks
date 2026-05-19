import { WayfinderQuoteInvoiceBuilderV6 } from "@/features/sites/wayfinder/admin/quote-invoice-builder-v6";

export const metadata = {
  title: "New Invoice - Gateworks Admin"
};

export default function NewInvoicePage() {
  return <WayfinderQuoteInvoiceBuilderV6 mode="invoice" />;
}
