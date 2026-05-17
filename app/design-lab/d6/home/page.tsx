import type { Metadata } from "next";
import { D6Home } from "@/features/design-lab/d6/home";

export const metadata: Metadata = { title: "Design Lab — Apex / Home" };

export default function D6HomePage() {
  return <D6Home />;
}
