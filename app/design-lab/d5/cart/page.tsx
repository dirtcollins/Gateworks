import type { Metadata } from "next";
import D5Cart from "@/features/design-lab/d5/cart";

export const metadata: Metadata = {
  title: "Design 5 — Cart",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D5Cart />;
}
