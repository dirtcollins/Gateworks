import type { Metadata } from "next";
import { D9Home } from "@/features/design-lab/d9/home";

export const metadata: Metadata = { title: "Design Lab — Showroom / Home" };

export default function D9HomePage() {
  return <D9Home />;
}
