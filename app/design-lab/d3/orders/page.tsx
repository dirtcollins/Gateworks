import type { Metadata } from "next";
import { D3Orders } from "@/features/design-lab/d3/orders";

export const metadata: Metadata = {
  title: "Design 3 — Editorial Catalog · Orders"
};

export default function Page() {
  return <D3Orders />;
}
