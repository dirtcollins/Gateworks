"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { alertCountForHref, useAdminAlerts } from "@/lib/admin-alerts";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin shell. Provides the back-office chrome
 * (the storefront chrome is suppressed for /industrial/admin via
 * this route's own layout). Sidebar nav, sticky header.
 * ------------------------------------------------------------------ */

type AdminNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  comingSoon?: boolean;
};

const NAV_GROUPS: Array<{ heading: string; items: AdminNavItem[] }> = [
  {
    heading: "Operations",
    items: [
      { href: "/industrial/admin", label: "Dashboard", Icon: LayoutDashboard },
      { href: "/industrial/admin/orders", label: "Orders", Icon: ClipboardList },
      { href: "/industrial/admin/quotes", label: "Quotes", Icon: FileText },
      {
        href: "/industrial/admin/purchase-orders",
        label: "Purchase orders",
        Icon: ClipboardCheck
      },
      { href: "/industrial/admin/reports", label: "Reports", Icon: BarChart3 }
    ]
  },
  {
    heading: "Merchandising",
    items: [
      { href: "/industrial/admin/catalog", label: "Catalog", Icon: ShoppingCart },
      { href: "/industrial/admin/products", label: "Products", Icon: Package },
      { href: "/industrial/admin/inventory", label: "Inventory", Icon: Boxes }
    ]
  },
  {
    heading: "Network",
    items: [
      { href: "/industrial/admin/customers", label: "Customers", Icon: Users },
      { href: "/industrial/admin/procurement", label: "Procurement", Icon: Truck },
      { href: "/industrial/admin/pick-tickets", label: "Pick tickets", Icon: ClipboardCheck },
      { href: "/industrial/admin/warehouse", label: "Warehouse", Icon: Warehouse },
      { href: "/industrial/admin/demand", label: "Demand", Icon: TrendingUp }
    ]
  }
];

function isActivePath(pathname: string, href: string) {
  if (href === "/industrial/admin") return pathname === "/industrial/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function flatNav() {
  return NAV_GROUPS.flatMap((group) => group.items);
}

export function IndustrialAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/industrial/admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const alerts = useAdminAlerts();

  const activeItem = flatNav().find((item) => isActivePath(pathname, item.href));

  return (
    <div className="flex min-h-screen bg-d1-paper text-d1-ink">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col border-r-2 border-d1-ink bg-d1-ink text-d1-paper transition-transform duration-150 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link
            className="flex items-center gap-2.5"
            href="/industrial/admin"
            onClick={() => setMobileOpen(false)}
          >
            <span className="grid h-9 w-9 place-items-center bg-d1-paper text-base font-black text-d1-ink">
              G
            </span>
            <span className="leading-none">
              <span className="block text-base font-extrabold tracking-tight">
                GATEWORKS
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-d1-amber">
                Operations
              </span>
            </span>
          </Link>
          <button
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center border border-white/15 text-d1-paper md:hidden"
            onClick={() => setMobileOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAV_GROUPS.map((group) => (
            <div className="mb-5" key={group.heading}>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-d1-paper/40">
                {group.heading}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.Icon;
                  const active = isActivePath(pathname, item.href);

                  if (item.comingSoon) {
                    return (
                      <span
                        aria-disabled="true"
                        className="flex cursor-not-allowed items-center justify-between gap-2.5 px-2.5 py-2 text-[13px] font-semibold text-d1-paper/35"
                        key={item.href}
                        title="Available in a later release"
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          {item.label}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-d1-paper/30">
                          Soon
                        </span>
                      </span>
                    );
                  }

                  return (
                    <Link
                      className={`flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-bold uppercase tracking-[0.06em] transition ${
                        active
                          ? "bg-d1-pine text-d1-paper"
                          : "text-d1-paper/70 hover:bg-white/[0.07] hover:text-d1-paper"
                      }`}
                      href={item.href}
                      key={item.href}
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                      {alertCountForHref(item.href, alerts) > 0 ? (
                        <span
                          className="ml-auto grid h-[18px] min-w-[18px] place-items-center rounded-full bg-d1-amber px-1 text-[10px] font-black text-d1-ink"
                          title="Needs attention"
                        >
                          {alertCountForHref(item.href, alerts)}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <Link
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-d1-paper/55 transition hover:text-d1-paper"
            href="/industrial"
          >
            <Truck className="h-3.5 w-3.5" />
            Back to storefront
          </Link>
        </div>
      </aside>

      {mobileOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b-2 border-d1-ink bg-d1-paper px-5 py-3">
          <button
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center border border-d1-ink bg-white md:hidden"
            onClick={() => setMobileOpen(true)}
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-d1-pine">
              Gateworks Operations
            </p>
            <p className="truncate text-sm font-extrabold text-d1-ink">
              {activeItem ? activeItem.label : "Operations"}
            </p>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
