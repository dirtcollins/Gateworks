import type { Metadata } from "next";
import { D2Cart } from "@/features/design-lab/d2/cart";

export const metadata: Metadata = {
  title: "Design Lab — D2 Warehouse Dark · Cart"
};

export default function Page() {
  return <D2Cart />;
}
