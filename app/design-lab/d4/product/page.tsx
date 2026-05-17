import type { Metadata } from "next";
import { D4Product } from "@/features/design-lab/d4/product";

export const metadata: Metadata = {
  title: "Design 4 — Product",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D4Product />;
}
