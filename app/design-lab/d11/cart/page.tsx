import type { Metadata } from "next";
import { D11Cart } from "@/features/design-lab/d11/cart";

export const metadata: Metadata = {
  title: "Design Lab — Wayfinder / Cart",
  robots: { index: false, follow: false }
};

export default function D11CartPage() {
  return <D11Cart />;
}
