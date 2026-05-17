// Wayfinder — checkout route. Schedules will-call pickup or jobsite delivery
// and posts a real order to /api/orders.
import type { Metadata } from "next";
import { WayfinderCheckout } from "@/features/sites/wayfinder/checkout-page";

export const metadata: Metadata = { title: "Checkout" };

export default function WayfinderCheckoutPage() {
  return <WayfinderCheckout />;
}
