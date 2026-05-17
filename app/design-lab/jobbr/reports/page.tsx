import type { Metadata } from "next";
import { JobbrReports } from "@/features/design-lab/jobbr/pages";

export const metadata: Metadata = { title: "Design Lab — Jobbr / Reports" };

export default function JobbrReportsPage() {
  return <JobbrReports />;
}
