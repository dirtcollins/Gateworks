import type { Metadata } from "next";
import { D6Category } from "@/features/design-lab/d6/category";

export const metadata: Metadata = { title: "Design Lab — Apex / Category" };

export default function D6CategoryPage() {
  return <D6Category />;
}
