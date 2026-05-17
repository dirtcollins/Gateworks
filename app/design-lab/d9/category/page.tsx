import type { Metadata } from "next";
import { D9Category } from "@/features/design-lab/d9/category";

export const metadata: Metadata = { title: "Design Lab — Showroom / Collection" };

export default function D9CategoryPage() {
  return <D9Category />;
}
