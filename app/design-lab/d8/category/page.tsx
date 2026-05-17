import type { Metadata } from "next";
import { D8Category } from "@/features/design-lab/d8/category";

export const metadata: Metadata = {
  title: "Design Lab — Blueprint / Component Set",
  robots: { index: false, follow: false }
};

export default function D8CategoryPage() {
  return <D8Category />;
}
