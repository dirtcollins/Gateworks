import type { Metadata } from "next";
import { D2Orders } from "@/features/design-lab/d2/orders";

export const metadata: Metadata = {
  title: "Design Lab — D2 Warehouse Dark · Orders"
};

export default function Page() {
  return <D2Orders />;
}
