import type { Metadata } from "next";
import { JobbrProduct } from "@/features/design-lab/jobbr/pages";

export const metadata: Metadata = { title: "Design Lab — Jobbr / Product" };

export default function JobbrProductPage() {
  return <JobbrProduct />;
}
