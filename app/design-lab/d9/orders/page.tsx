import type { Metadata } from "next";
import { D9Orders } from "@/features/design-lab/d9/orders";

export const metadata: Metadata = { title: "Design Lab — Showroom / Orders" };

export default function D9OrdersPage() {
  return <D9Orders />;
}
