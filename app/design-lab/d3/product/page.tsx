import type { Metadata } from "next";
import { D3Product } from "@/features/design-lab/d3/product";

export const metadata: Metadata = {
  title: "Design 3 — Editorial Catalog · Product"
};

export default function Page() {
  return <D3Product />;
}
