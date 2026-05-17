import type { Metadata } from "next";
import { D9Cart } from "@/features/design-lab/d9/cart";

export const metadata: Metadata = { title: "Design Lab — Showroom / Cart" };

export default function D9CartPage() {
  return <D9Cart />;
}
