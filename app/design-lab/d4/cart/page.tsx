import type { Metadata } from "next";
import { D4Cart } from "@/features/design-lab/d4/cart";

export const metadata: Metadata = {
  title: "Design 4 — Cart",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D4Cart />;
}
