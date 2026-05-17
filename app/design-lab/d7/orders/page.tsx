import type { Metadata } from "next";
import { D7Orders } from "@/features/design-lab/d7/orders";

export const metadata: Metadata = { title: "Design Lab — Ledger / Order Ledger" };

export default function D7OrdersPage() {
  return <D7Orders />;
}
