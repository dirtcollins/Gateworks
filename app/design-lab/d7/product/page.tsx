import type { Metadata } from "next";
import { D7Product } from "@/features/design-lab/d7/product";

export const metadata: Metadata = { title: "Design Lab — Ledger / Product" };

export default function D7ProductPage() {
  return <D7Product />;
}
