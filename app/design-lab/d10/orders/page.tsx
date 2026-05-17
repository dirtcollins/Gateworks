import type { Metadata } from "next";
import { D10Orders } from "@/features/design-lab/d10/orders";

export const metadata: Metadata = {
  title: "Design Lab — Signal / Orders",
  robots: { index: false, follow: false }
};

export default function D10OrdersPage() {
  return <D10Orders />;
}
