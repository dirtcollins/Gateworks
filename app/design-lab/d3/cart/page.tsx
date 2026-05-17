import type { Metadata } from "next";
import { D3Cart } from "@/features/design-lab/d3/cart";

export const metadata: Metadata = {
  title: "Design 3 — Editorial Catalog · Cart"
};

export default function Page() {
  return <D3Cart />;
}
