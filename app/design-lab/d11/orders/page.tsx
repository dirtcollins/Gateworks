import type { Metadata } from "next";
import { D11Orders } from "@/features/design-lab/d11/orders";

export const metadata: Metadata = {
  title: "Design Lab — Wayfinder / Orders",
  robots: { index: false, follow: false }
};

export default function D11OrdersPage() {
  return <D11Orders />;
}
