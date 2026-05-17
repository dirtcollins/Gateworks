import type { Metadata } from "next";
import D5Product from "@/features/design-lab/d5/product";

export const metadata: Metadata = {
  title: "Design 5 — Product",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D5Product />;
}
