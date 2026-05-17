import type { Metadata } from "next";
import { D7Cart } from "@/features/design-lab/d7/cart";

export const metadata: Metadata = { title: "Design Lab — Ledger / Purchase Order" };

export default function D7CartPage() {
  return <D7Cart />;
}
