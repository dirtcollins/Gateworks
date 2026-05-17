import type { Metadata } from "next";
import { D3Reports } from "@/features/design-lab/d3/reports";

export const metadata: Metadata = {
  title: "Design 3 — Editorial Catalog · Reports"
};

export default function Page() {
  return <D3Reports />;
}
