import type { Metadata } from "next";
import D5Orders from "@/features/design-lab/d5/orders";

export const metadata: Metadata = {
  title: "Design 5 — Orders",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D5Orders />;
}
