import type { Metadata } from "next";
import { D2Category } from "@/features/design-lab/d2/category";

export const metadata: Metadata = {
  title: "Design Lab — D2 Warehouse Dark · Catalog"
};

export default function Page() {
  return <D2Category />;
}
