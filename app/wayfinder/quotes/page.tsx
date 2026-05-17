// Wayfinder — quotes list route. Reads every quote from the real quote store.
import type { Metadata } from "next";
import { WayfinderQuotes } from "@/features/sites/wayfinder/quotes-page";

export const metadata: Metadata = { title: "Quotes" };

export default function WayfinderQuotesPage() {
  return <WayfinderQuotes />;
}
