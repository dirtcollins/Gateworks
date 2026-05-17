import type { Metadata } from "next";
import { D1Category } from "@/features/design-lab/d1/category";

export const metadata: Metadata = {
  title: "Design Lab — Concept 1 / Category"
};

export default function D1CategoryPage() {
  return <D1Category />;
}
