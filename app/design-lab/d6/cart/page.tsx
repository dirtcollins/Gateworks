import type { Metadata } from "next";
import { D6Cart } from "@/features/design-lab/d6/cart";

export const metadata: Metadata = { title: "Design Lab — Apex / Cart" };

export default function D6CartPage() {
  return <D6Cart />;
}
