import type { Metadata } from "next";
import { D3Category } from "@/features/design-lab/d3/category";

export const metadata: Metadata = {
  title: "Design 3 — Editorial Catalog · Catalog"
};

export default function Page() {
  return <D3Category />;
}
