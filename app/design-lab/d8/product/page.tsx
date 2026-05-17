import type { Metadata } from "next";
import { D8Product } from "@/features/design-lab/d8/product";

export const metadata: Metadata = {
  title: "Design Lab — Blueprint / Spec Sheet",
  robots: { index: false, follow: false }
};

export default function D8ProductPage() {
  return <D8Product />;
}
