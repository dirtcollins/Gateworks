import type { Metadata } from "next";
import { D10Category } from "@/features/design-lab/d10/category";

export const metadata: Metadata = {
  title: "Design Lab — Signal / Category",
  robots: { index: false, follow: false }
};

export default function D10CategoryPage() {
  return <D10Category />;
}
