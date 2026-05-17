import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  IndustrialFooter,
  IndustrialHeader
} from "@/features/sites/industrial/kit";

export const metadata: Metadata = {
  title: {
    default: "Industrial Pro | Gateworks Industrial Supply",
    template: "%s | Gateworks Industrial Supply"
  },
  description:
    "Gate hardware, structural steel, ornamental iron and welding supply — priced for contractors and stocked for same-day will-call pickup."
};

export default function IndustrialLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-d1-paper font-d1 text-d1-ink antialiased">
      <IndustrialHeader />
      {children}
      <IndustrialFooter />
    </div>
  );
}
