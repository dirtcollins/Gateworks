import type { Metadata } from "next";
import { D2Product } from "@/features/design-lab/d2/product";

export const metadata: Metadata = {
  title: "Design Lab — D2 Warehouse Dark · Product"
};

export default function Page() {
  return <D2Product />;
}
