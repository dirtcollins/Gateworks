import type { Metadata } from "next";
import { D4Home } from "@/features/design-lab/d4/home";

export const metadata: Metadata = {
  title: "Design 4 — Home",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D4Home />;
}
