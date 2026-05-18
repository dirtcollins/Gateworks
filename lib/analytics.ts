export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

export const analyticsEnabled = GA_MEASUREMENT_ID.length > 0;

type GtagParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: GtagParams = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", name, params);
}

// Conversion-funnel event names for the Wayfinder storefront. Kept here so the
// names stay consistent across components and are documented in one place.
// All are wired through trackEvent(), which no-ops safely when GA is not
// configured (no NEXT_PUBLIC_GA_MEASUREMENT_ID -> no window.gtag).
//   view_item     — product detail page viewed
//   add_to_cart   — item added to the cart
//   begin_checkout— checkout page mounted with items
//   quote_created — a customer quote draft was created (from a product page)
//   quote_submitted — a quote was submitted to staff
//   purchase      — an order was successfully placed
//   po_submitted  — a customer purchase-order checkout was submitted
export const FunnelEvent = {
  viewItem: "view_item",
  addToCart: "add_to_cart",
  beginCheckout: "begin_checkout",
  quoteCreated: "quote_created",
  quoteSubmitted: "quote_submitted",
  purchase: "purchase",
  poSubmitted: "po_submitted"
} as const;
