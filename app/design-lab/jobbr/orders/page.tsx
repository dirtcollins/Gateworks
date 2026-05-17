import type { Metadata } from "next";
import { JobbrOrders } from "@/features/design-lab/jobbr/pages";

export const metadata: Metadata = { title: "Design Lab — Jobbr / Orders" };

export default function JobbrOrdersPage() {
  return <JobbrOrders />;
}
