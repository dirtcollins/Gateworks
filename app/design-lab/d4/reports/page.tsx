import type { Metadata } from "next";
import { D4Reports } from "@/features/design-lab/d4/reports";

export const metadata: Metadata = {
  title: "Design 4 — Reports",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D4Reports />;
}
