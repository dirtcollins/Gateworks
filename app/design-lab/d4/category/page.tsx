import type { Metadata } from "next";
import { D4Category } from "@/features/design-lab/d4/category";

export const metadata: Metadata = {
  title: "Design 4 — Category",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D4Category />;
}
