import type { Metadata } from "next";
import { D11Home } from "@/features/design-lab/d11/home";

export const metadata: Metadata = {
  title: "Design Lab — Wayfinder / Home",
  robots: { index: false, follow: false }
};

export default function D11HomePage() {
  return <D11Home />;
}
