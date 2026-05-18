// Wayfinder admin — back-office layout. Wraps every /admin/* route in
// the operations-console shell (black aisle-map context rail + sidebar nav).
// This layout is nested inside the (site) route-group layout, so it replaces
// the storefront chrome for the admin.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WayfinderAdminShell } from "@/features/sites/wayfinder/admin/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Operations · Wayfinder Admin",
    template: "%s · Wayfinder Admin"
  },
  description: "Wayfinder operations console — orders, quotes, and reports for the Bakersfield warehouse."
};

export default function WayfinderAdminLayout({ children }: { children: ReactNode }) {
  return <WayfinderAdminShell>{children}</WayfinderAdminShell>;
}
