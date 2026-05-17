import type { Metadata } from "next";
import { D1Orders } from "@/features/design-lab/d1/orders";

export const metadata: Metadata = {
  title: "Design Lab — Concept 1 / Orders"
};

export default function D1OrdersPage() {
  return <D1Orders />;
}
