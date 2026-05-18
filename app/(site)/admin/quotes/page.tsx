// Wayfinder admin — quotes list route.
import { WayfinderQuotesList } from "@/features/sites/wayfinder/admin/quotes-list";

export const metadata = {
  title: "Quotes"
};

export default function WayfinderAdminQuotesPage() {
  return <WayfinderQuotesList />;
}
