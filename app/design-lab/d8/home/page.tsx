import type { Metadata } from "next";
import { D8Home } from "@/features/design-lab/d8/home";

export const metadata: Metadata = {
  title: "Design Lab — Blueprint / Home",
  robots: { index: false, follow: false }
};

export default function D8HomePage() {
  return <D8Home />;
}
