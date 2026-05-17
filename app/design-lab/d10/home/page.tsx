import type { Metadata } from "next";
import { D10Home } from "@/features/design-lab/d10/home";

export const metadata: Metadata = {
  title: "Design Lab — Signal / Home",
  robots: { index: false, follow: false }
};

export default function D10HomePage() {
  return <D10Home />;
}
