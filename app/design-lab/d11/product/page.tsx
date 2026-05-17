import type { Metadata } from "next";
import { D11Product } from "@/features/design-lab/d11/product";

export const metadata: Metadata = {
  title: "Design Lab — Wayfinder / Product",
  robots: { index: false, follow: false }
};

export default function D11ProductPage() {
  return <D11Product />;
}
