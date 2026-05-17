import type { Metadata } from "next";
import { D8Orders } from "@/features/design-lab/d8/orders";

export const metadata: Metadata = {
  title: "Design Lab — Blueprint / Build Log",
  robots: { index: false, follow: false }
};

export default function D8OrdersPage() {
  return <D8Orders />;
}
