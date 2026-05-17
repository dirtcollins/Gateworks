import type { Metadata } from "next";
import { D1Product } from "@/features/design-lab/d1/product";

export const metadata: Metadata = {
  title: "Design Lab — Concept 1 / Product"
};

export default function D1ProductPage() {
  return <D1Product />;
}
