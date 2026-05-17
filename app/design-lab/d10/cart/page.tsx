import type { Metadata } from "next";
import { D10Cart } from "@/features/design-lab/d10/cart";

export const metadata: Metadata = {
  title: "Design Lab — Signal / Cart",
  robots: { index: false, follow: false }
};

export default function D10CartPage() {
  return <D10Cart />;
}
