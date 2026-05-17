import type { Metadata } from "next";
import { JobbrCart } from "@/features/design-lab/jobbr/pages";

export const metadata: Metadata = { title: "Design Lab — Jobbr / Cart" };

export default function JobbrCartPage() {
  return <JobbrCart />;
}
