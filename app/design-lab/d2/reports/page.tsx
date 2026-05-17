import type { Metadata } from "next";
import { D2Reports } from "@/features/design-lab/d2/reports";

export const metadata: Metadata = {
  title: "Design Lab — D2 Warehouse Dark · Reports"
};

export default function Page() {
  return <D2Reports />;
}
