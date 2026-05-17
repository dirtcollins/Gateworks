import type { Metadata } from "next";
import { D6Product } from "@/features/design-lab/d6/product";

export const metadata: Metadata = { title: "Design Lab — Apex / Product" };

export default function D6ProductPage() {
  return <D6Product />;
}
