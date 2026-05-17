import type { Metadata } from "next";
import { D4Orders } from "@/features/design-lab/d4/orders";

export const metadata: Metadata = {
  title: "Design 4 — Orders",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D4Orders />;
}
