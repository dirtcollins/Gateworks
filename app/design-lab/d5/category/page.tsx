import type { Metadata } from "next";
import D5Category from "@/features/design-lab/d5/category";

export const metadata: Metadata = {
  title: "Design 5 — Catalog",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D5Category />;
}
