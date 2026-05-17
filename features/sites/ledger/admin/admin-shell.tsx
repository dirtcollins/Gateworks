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
  PackageSearch,
  Plus,
  TrendingUp,
  Users,
  Warehouse,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LEDGER } from "@/features/sites/ledger/kit";

/* ------------------------------------------------------------------ *
 * LEDGER — admin / back-office shell
 * The procurement portal's operations workspace. A calm, paper-white
 * institutional layout: fixed indigo-tinted sidebar, hairline borders,
 * generous whitespace — the same Ledger language as the storefront.
 * Wave 3 ships dashboard / orders / quotes / reports; Wave 4 ships
 * catalog / products / inventory; Wave 5 completes the workspace with
 * customers / pick tickets / warehouse / demand.
 * ------------------------------------------------------------------ */

type AdminNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  soon?: boolean;
};

const PRIMARY_NAV: AdminNavItem[] = [
  { href: "/ledger/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/ledger/admin/orders", label: "Orders", Icon: ClipboardList },
  { href: "/ledger/admin/quotes", label: "Quotes", Icon: FileText },
  { href: "/ledger/admin/customers", label: "Customers", Icon: Users },
  { href: "/ledger/admin/reports", label: "Reports", Icon: BarChart3 }
];

const CATALOG_NAV: AdminNavItem[] = [
  { href: "/ledger/admin/catalog", label: "Catalog", Icon: Boxes },
  { href: "/ledger/admin/products", label: "Products", Icon: PackageSearch },
  { href: "/ledger/admin/inventory", label: "Inventory", Icon: Boxes },
  { href: "/ledger/admin/demand", label: "Demand", Icon: TrendingUp }
];

const FULFILLMENT_NAV: AdminNavItem[] = [
  { href: "/ledger/admin/pick-tickets", label: "Pick tickets", Icon: ClipboardCheck },
  { href: "/ledger/admin/warehouse", label: "Warehouse", Icon: Warehouse }
];

function isActivePath(currentPath: string, itemPath: string) {
  if (itemPath === "/ledger/admin") return currentPath === "/ledger/admin";
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

function NavSection({
  heading,
  items,
  pathname,
  onNavigate
}: {
  heading: string;
  items: AdminNavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <p
        className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em]"
        style={{ color: LEDGER.muted }}
      >
        {heading}
      </p>
      <nav className="grid gap-0.5">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition"
              style={{
                color: active ? LEDGER.indigo : LEDGER.body,
                backgroundColor: active ? LEDGER.indigoSoft : "transparent"
              }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.soon ? (
                <span
                  className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]"
                  style={{ backgroundColor: LEDGER.canvas, color: LEDGER.muted }}
                >
                  Soon
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function LedgerAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/ledger/admin";
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem =
    [...PRIMARY_NAV, ...CATALOG_NAV, ...FULFILLMENT_NAV].find((item) =>
      isActivePath(pathname, item.href)
    ) ?? PRIMARY_NAV[0];

  const sidebarBody = (
    <div className="flex h-full flex-col">
      <Link
        href="/ledger/admin"
        onClick={() => setMobileOpen(false)}
        className="flex items-center gap-2.5 px-3 py-4"
      >
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white"
          style={{ backgroundColor: LEDGER.indigo }}
        >
          G
        </span>
        <span className="leading-none">
          <span
            className="block text-[14px] font-semibold tracking-tight"
            style={{ color: LEDGER.ink }}
          >
            Gateworks
          </span>
          <span
            className="block text-[10px] font-medium uppercase tracking-[0.18em]"
            style={{ color: LEDGER.muted }}
          >
            Operations
          </span>
        </span>
      </Link>

      <div className="px-3 pb-2">
        <Link
          href="/ledger/admin/orders/new"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition"
          style={{ backgroundColor: LEDGER.indigo }}
        >
          <Plus className="h-4 w-4" /> New order
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        <NavSection
          heading="Workspace"
          items={PRIMARY_NAV}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
        <NavSection
          heading="Catalog & demand"
          items={CATALOG_NAV}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
        <NavSection
          heading="Fulfillment"
          items={FULFILLMENT_NAV}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <div
        className="mx-3 mb-3 rounded-xl p-3"
        style={{ backgroundColor: LEDGER.canvas }}
      >
        <p className="text-[12px] font-semibold" style={{ color: LEDGER.ink }}>
          Account #GW-40128
        </p>
        <p className="mt-0.5 text-[11px]" style={{ color: LEDGER.muted }}>
          Operations workspace
        </p>
        <Link
          href="/ledger"
          className="mt-2 inline-block text-[11px] font-semibold transition hover:underline"
          style={{ color: LEDGER.indigo }}
        >
          Back to storefront
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: LEDGER.canvas, color: LEDGER.ink }}
    >
      {/* Static sidebar (desktop) */}
      <aside
        className="hidden w-[244px] shrink-0 lg:block"
        style={{
          backgroundColor: LEDGER.surface,
          borderRight: `1px solid ${LEDGER.line}`
        }}
      >
        <div className="sticky top-0 h-screen">{sidebarBody}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0"
            onClick={() => setMobileOpen(false)}
            style={{ backgroundColor: "rgba(21,24,31,0.4)" }}
            type="button"
          />
          <aside
            className="absolute inset-y-0 left-0 w-[260px]"
            style={{
              backgroundColor: LEDGER.surface,
              borderRight: `1px solid ${LEDGER.line}`
            }}
          >
            {sidebarBody}
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 backdrop-blur"
          style={{
            backgroundColor: "rgba(255,255,255,0.92)",
            borderBottom: `1px solid ${LEDGER.line}`
          }}
        >
          <button
            aria-label="Open menu"
            className="grid h-9 w-9 place-items-center rounded-lg lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            style={{ border: `1px solid ${LEDGER.line}`, color: LEDGER.ink }}
            type="button"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <div className="min-w-0">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: LEDGER.muted }}
            >
              Operations
            </p>
            <p
              className="truncate text-[15px] font-semibold tracking-tight"
              style={{ color: LEDGER.ink }}
            >
              {activeItem.label}
            </p>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
