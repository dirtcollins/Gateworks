import type { Metadata } from "next";
import { JobbrCategory } from "@/features/design-lab/jobbr/pages";

export const metadata: Metadata = { title: "Design Lab — Jobbr / Category" };

export default function JobbrCategoryPage() {
  return <JobbrCategory />;
}
