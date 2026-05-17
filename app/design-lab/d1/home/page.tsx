import type { Metadata } from "next";
import { D1Home } from "@/features/design-lab/d1/home";

export const metadata: Metadata = {
  title: "Design Lab — Concept 1 / Home"
};

export default function D1HomePage() {
  return <D1Home />;
}
