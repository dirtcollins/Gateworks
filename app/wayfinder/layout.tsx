// Wayfinder — standalone storefront. This layout wraps every /wayfinder/*
// route in the Wayfinder shell (black aisle-map context bar, header with nav +
// search + cart, aisle-coded department strip, footer). The app's global
// sidebar is suppressed for /wayfinder routes, so this provides all chrome.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WayfinderShell } from "@/features/sites/wayfinder/shell";

export const metadata: Metadata = {
  title: {
    default: "Wayfinder · Gateworks Supply",
    template: "%s · Wayfinder"
  },
  description:
    "Wayfinder — the warehouse-wayfinding storefront for Gateworks Supply. Gate hardware, steel tubing, ornamental iron, fence, and welding supply, stocked and mapped for same-day will-call pickup."
};

export default function WayfinderLayout({ children }: { children: ReactNode }) {
  return <WayfinderShell>{children}</WayfinderShell>;
}
