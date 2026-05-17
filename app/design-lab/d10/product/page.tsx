import type { Metadata } from "next";
import { D10Product } from "@/features/design-lab/d10/product";

export const metadata: Metadata = {
  title: "Design Lab — Signal / Product",
  robots: { index: false, follow: false }
};

export default function D10ProductPage() {
  return <D10Product />;
}
