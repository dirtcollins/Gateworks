import type { Metadata } from "next";
import { D7Category } from "@/features/design-lab/d7/category";

export const metadata: Metadata = { title: "Design Lab — Ledger / Catalog" };

export default function D7CategoryPage() {
  return <D7Category />;
}
