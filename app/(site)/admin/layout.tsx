// Wayfinder admin — back-office layout. Wraps every /admin/* route in the
// operations-console shell (black aisle-map context rail + sidebar nav).
// This layout is nested inside the (site) route-group layout, so it replaces
// the storefront chrome for the admin.
//
// Exception: the auth surfaces (/admin/login, /admin/access-denied) must NOT
// render the admin shell — they are reachable without a session, so showing
// the sidebar nav would be both wrong and a small information leak. The
// chrome-vs-bare decision is a client check on the pathname.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminLayoutChrome } from "./layout-chrome";

export const metadata: Metadata = {
  title: {
    default: "Operations · Wayfinder Admin",
    template: "%s · Wayfinder Admin"
  },
  description:
    "Wayfinder operations console — orders, quotes, and reports for the Bakersfield warehouse."
};

export default function WayfinderAdminLayout({
  children
}: {
  children: ReactNode;
}) {
  return <AdminLayoutChrome>{children}</AdminLayoutChrome>;
}
