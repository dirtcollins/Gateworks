import type { Metadata } from "next";
import { D7Home } from "@/features/design-lab/d7/home";

export const metadata: Metadata = { title: "Design Lab — Ledger / Home" };

export default function D7HomePage() {
  return <D7Home />;
}
