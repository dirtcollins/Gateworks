// Wayfinder — quote builder route. Builds / edits the active quote in the real
// quote store. Pass no quoteId so the builder targets the active quote.
import type { Metadata } from "next";
import { WayfinderQuoteBuilder } from "@/features/sites/wayfinder/quote-page";

export const metadata: Metadata = { title: "Quote builder" };

export default function WayfinderQuotePage() {
  return <WayfinderQuoteBuilder />;
}
