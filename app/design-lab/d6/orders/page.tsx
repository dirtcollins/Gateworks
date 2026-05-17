import type { Metadata } from "next";
import { D6Orders } from "@/features/design-lab/d6/orders";

export const metadata: Metadata = { title: "Design Lab — Apex / Orders" };

export default function D6OrdersPage() {
  return <D6Orders />;
}
