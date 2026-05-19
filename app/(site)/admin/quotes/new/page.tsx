import { WayfinderQuoteInvoiceBuilderV6 } from "@/features/sites/wayfinder/admin/quote-invoice-builder-v6";

export const metadata = {
  title: "New Quote - Gateworks Admin"
};

export default function NewQuotePage() {
  return <WayfinderQuoteInvoiceBuilderV6 mode="quote" />;
}
