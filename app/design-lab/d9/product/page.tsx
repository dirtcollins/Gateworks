import type { Metadata } from "next";
import { D9Product } from "@/features/design-lab/d9/product";

export const metadata: Metadata = { title: "Design Lab — Showroom / Flagship" };

export default function D9ProductPage() {
  return <D9Product />;
}
