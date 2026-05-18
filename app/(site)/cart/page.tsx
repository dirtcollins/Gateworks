// Wayfinder — cart route. Renders the cart client component inside the
// Wayfinder shell (provided by the (site) route-group layout).
import type { Metadata } from "next";
import { WayfinderCart } from "@/features/sites/wayfinder/cart-page";

export const metadata: Metadata = { title: "Cart" };

export default function WayfinderCartPage() {
  return <WayfinderCart />;
}
