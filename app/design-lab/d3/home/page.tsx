import type { Metadata } from "next";
import { D3Home } from "@/features/design-lab/d3/home";

export const metadata: Metadata = {
  title: "Design 3 — Editorial Catalog · Home"
};

export default function Page() {
  return <D3Home />;
}
