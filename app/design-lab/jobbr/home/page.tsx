import type { Metadata } from "next";
import { JobbrHome } from "@/features/design-lab/jobbr/pages";

export const metadata: Metadata = { title: "Design Lab — Jobbr / Home" };

export default function JobbrHomePage() {
  return <JobbrHome />;
}
