import type { Metadata } from "next";
import { D1Cart } from "@/features/design-lab/d1/cart";

export const metadata: Metadata = {
  title: "Design Lab — Concept 1 / Cart"
};

export default function D1CartPage() {
  return <D1Cart />;
}
