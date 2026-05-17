import type { Metadata } from "next";
import D5Home from "@/features/design-lab/d5/home";

export const metadata: Metadata = {
  title: "Design 5 — Home",
  robots: { index: false, follow: false }
};

export default function Page() {
  return <D5Home />;
}
