"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GateworksLogo } from "@/components/gateworks-logo";
import { AdminOrderBootstrap } from "@/components/admin/admin-order-bootstrap";
import { usePathname } from "next/navigation";
import {
  CircleUserRound,
  ClipboardList,
  Database,
  LayoutDashboard,
  FileText,
  Menu,
  Package,
  ShoppingCart,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type AdminNavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  disabled?: boolean;
};

const adminNavigationItems: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", Icon: CircleUserRound },
  { href: "/admin/quotes", label: "Quotes", Icon: FileText },
  { href: "/admin/pick-tickets", label: "Pick Tickets", Icon: Package },
  { href: "/admin/inventory", label: "Inventory", Icon: Database },
  { href: "/admin/products", label: "Products", Icon: ShoppingCart }
];

type AdminShellProps = {
  children: ReactNode;
};

function isActivePath(currentPath: string, itemPath: string) {
  if (itemPath === "/admin") {
    return currentPath === "/admin";
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname() || "/admin";
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const isAuthAdminRoute = useMemo(() => {
    return [
      "/admin/login",
      "/admin/access-denied"
    ].some((route) => pathname === route || pathname.startsWith(`${route}/`));
  }, [pathname]);

  const activeItem = useMemo(
    () => adminNavigationItems.find((item) => isActivePath(pathname, item.href)),
    [pathname]
  );

  if (isAuthAdminRoute) {
    return (
      <div className="min-h-[100dvh] bg-industrial-paper">
        <AdminOrderBootstrap />
        {children}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] overflow-hidden bg-industrial-paper text-black">
      <button
        className="absolute left-4 top-4 z-30 rounded-lg border border-industrial-rail bg-white p-2 text-black shadow-sm transition md:hidden"
        onClick={() => setIsMobileNavOpen((value) => !value)}
        type="button"
        aria-label="Open admin menu"
      >
        <Menu size={18} />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-industrial-rail bg-white px-4 py-4 text-black transition-transform duration-200 md:static md:inset-auto md:w-72 md:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex items-center justify-between border-b border-industrial-rail pb-4">
          <div className="flex items-center gap-2">
            <GateworksLogo className="h-7 w-[180px]" height={28} width={180} />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-black">
              Operations
            </p>
          </div>
          <button
            className="rounded-lg border border-industrial-rail bg-white p-2 text-black transition hover:bg-industrial-paper md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            type="button"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-4 mb-3 px-1 text-xs font-semibold uppercase tracking-[0.14em] text-black">
          Core Operations
        </p>
        <nav className="space-y-1">
          {adminNavigationItems.map((item) => {
            const Icon = item.Icon;
            const isActive = isActivePath(pathname, item.href);
            const isDisabled = Boolean(item.disabled);

            return (
              <div key={item.label}>
                {isDisabled ? (
                <div
                    className={`flex items-center gap-3 rounded-xl border border-industrial-rail bg-transparent px-3 py-2.5 text-sm text-black ${
                      isActive ? "border-industrial-ink bg-industrial-paper text-black" : ""
                    }`}
                    aria-disabled="true"
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span className="truncate text-xs">{item.label}</span>
                  </div>
                ) : (
                  <Link
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border-industrial-ink bg-industrial-paper text-black"
                        : "border-transparent text-black hover:bg-industrial-paper"
                    }`}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {isMobileNavOpen ? (
        <button
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-slate-900/45 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          type="button"
        />
      ) : null}

      <div className="min-h-[100dvh] flex-1 bg-industrial-paper">
        <header className="sticky top-0 z-10 border-b border-industrial-rail bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-6 py-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-industrial-muted">
              {activeItem ? activeItem.label : "Operations"}
            </p>
            <h1 className="text-xl font-semibold text-industrial-ink md:text-[1.5rem]">Admin workspace</h1>
          </div>
          <span className="rounded-full border border-industrial-rail bg-white px-2.5 py-1 text-xs font-medium text-industrial-muted">
            {pathname}
          </span>
        </div>
      </header>

        <main className="w-full px-6 py-6">{children}</main>
        <AdminOrderBootstrap />
      </div>
    </div>
  );
}
