import type { Metadata } from "next";
import D5Reports from "@/features/design-lab/d5/reports";

export const metadata: Metadata = {
  title: "Design 5 — Reports",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D5Reports />;
}
