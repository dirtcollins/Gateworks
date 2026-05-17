import type { Metadata } from "next";
import { D8Cart } from "@/features/design-lab/d8/cart";

export const metadata: Metadata = {
  title: "Design Lab — Blueprint / Bill of Materials",
  robots: { index: false, follow: false }
};

export default function D8CartPage() {
  return <D8Cart />;
}
