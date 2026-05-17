import type { Metadata } from "next";
import { D2Home } from "@/features/design-lab/d2/home";

export const metadata: Metadata = {
  title: "Design Lab — D2 Warehouse Dark · Home"
};

export default function Page() {
  return <D2Home />;
}
