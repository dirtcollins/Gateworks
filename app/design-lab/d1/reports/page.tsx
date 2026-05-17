import type { Metadata } from "next";
import { D1Reports } from "@/features/design-lab/d1/reports";

export const metadata: Metadata = {
  title: "Design Lab — Concept 1 / Reports"
};

export default function D1ReportsPage() {
  return <D1Reports />;
}
