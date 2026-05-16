"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AdminOrderBootstrap } from "@/components/admin/admin-order-bootstrap";
import { usePathname } from "next/navigation";
import {
  CircleUserRound,
  BarChart3,
  ClipboardList,
  Database,
  LayoutDashboard,
  FileText,
  Menu,
  Package,
  PlusCircle,
  Search,
  Warehouse,
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
  { href: "/admin/products", label: "Products", Icon: ShoppingCart },
  { href: "/admin/catalog", label: "Catalog", Icon: ShoppingCart },
  { href: "/admin/demand", label: "Demand", Icon: BarChart3 },
  { href: "/admin/warehouse", label: "Warehouse", Icon: Warehouse }
];

const createMenuGroups = [
  {
    title: "Sales",
    items: [
      { label: "New Order", href: "/admin/orders/new" },
      { label: "New Quote", href: "/admin/quotes?action=create" },
      { label: "Quick Invoice", href: "/admin/quotes?action=create&type=invoice" },
      { label: "Counter Sale", href: "/admin/orders/new?type=counter-sale" },
      { label: "Add Customer", href: "/admin/customers?action=create" }
    ]
  },
  {
    title: "Products & Inventory",
    items: [
      { label: "Add Product", href: "/admin/products/new" },
      { label: "Purchase Order", href: "/admin/inventory?action=purchase-order" },
      { label: "Inventory Adjustment", href: "/admin/inventory?action=adjustment" }
    ]
  },
  {
    title: "Fabrication & Fulfillment",
    items: [
      { label: "Fabrication Job", href: "/admin/warehouse?workflow=fabrication" },
      { label: "Pick Ticket", href: "/admin/pick-tickets?action=create" },
      { label: "Schedule Delivery", href: "/admin/warehouse?workflow=delivery" }
    ]
  },
  {
    title: "Financial",
    items: [
      { label: "Expense", href: "/admin/orders/new?type=expense" }
    ]
  }
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
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isCreateMenuOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        createMenuRef.current?.contains(target) ||
        createButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsCreateMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCreateMenuOpen(false);
        createButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCreateMenuOpen]);

  if (isAuthAdminRoute) {
    return (
      <div className="min-h-[100dvh] bg-[#f7f7f4]">
        <AdminOrderBootstrap />
        {children}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100dvh] overflow-hidden bg-[#f6f5f1] text-industrial-ink">
      <button
        className="absolute left-3 top-3 z-30 rounded-lg border border-black/10 bg-white p-2 text-industrial-ink shadow-sm transition md:hidden"
        onClick={() => setIsMobileNavOpen((value) => !value)}
        type="button"
        aria-label="Open admin menu"
      >
        <Menu size={18} />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-black/10 bg-[#f7f7f4] px-2 py-2 text-industrial-ink transition-transform duration-150 md:static md:inset-auto md:translate-x-0 ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex h-12 items-center justify-between px-2">
          <Link
            className="flex min-w-0 items-center rounded-md px-1 py-1 transition hover:bg-[#efeee9]"
            href="/admin"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Gateworks admin dashboard"
          >
            <img
              alt="Gateworks"
              className="block h-7 w-[168px] object-contain object-left"
              src="/assets/logo.svg"
            />
          </Link>
          <button
            className="rounded-lg border border-black/10 bg-white p-2 text-industrial-ink transition hover:bg-[#efeee9] md:hidden"
            onClick={() => setIsMobileNavOpen(false)}
            type="button"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-2 grid gap-2 px-1">
          <button
            ref={createButtonRef}
            aria-controls="admin-create-menu"
            aria-expanded={isCreateMenuOpen}
            className="flex h-10 items-center gap-2 rounded-lg border border-black/10 bg-white px-2.5 text-sm font-medium text-industrial-ink shadow-sm transition hover:bg-[#fbfbf8] focus:outline-none focus:ring-2 focus:ring-[#235b4b]/20"
            onClick={() => setIsCreateMenuOpen((value) => !value)}
            type="button"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#235b4b] text-white">
              <PlusCircle size={16} aria-hidden="true" strokeWidth={2.2} />
            </span>
            <span>Create</span>
          </button>

          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={15} />
            <input
              className="h-10 w-full rounded-lg border border-black/10 bg-white pl-9 pr-3 text-sm text-industrial-ink outline-none transition placeholder:text-industrial-muted focus:border-black/20"
              placeholder="Search operations"
              type="search"
            />
          </label>
        </div>

        <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-industrial-muted">
          Workspace
        </p>
        <nav className="space-y-0.5 px-1">
          {adminNavigationItems.map((item) => {
            const Icon = item.Icon;
            const isActive = isActivePath(pathname, item.href);
            const isDisabled = Boolean(item.disabled);

            return (
              <div key={item.label}>
                {isDisabled ? (
                <div
                    className={`flex h-9 items-center gap-2.5 rounded-lg border border-transparent px-2.5 text-sm text-industrial-muted ${
                      isActive ? "border-black/10 bg-white text-industrial-ink" : ""
                    }`}
                    aria-disabled="true"
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className="truncate text-xs">{item.label}</span>
                  </div>
                ) : (
                  <Link
                    className={`group flex h-9 items-center gap-2.5 rounded-lg border px-2.5 text-sm font-medium transition ${
                      isActive
                        ? "border-black/10 bg-white text-industrial-ink shadow-sm"
                        : "border-transparent text-industrial-steel hover:bg-[#efeee9] hover:text-industrial-ink"
                    }`}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <Icon size={16} aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        <div className="mt-auto px-3 py-3">
          <p className="text-xs font-medium text-industrial-ink">Gateworks Operations</p>
          <p className="mt-1 text-xs leading-5 text-industrial-muted">Orders, quotes, inventory, and fulfillment.</p>
        </div>
      </aside>

      {isMobileNavOpen ? (
        <button
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
          type="button"
        />
      ) : null}

      {isCreateMenuOpen ? (
        <div
          ref={createMenuRef}
          className="fixed left-3 right-3 top-[104px] z-50 rounded-xl border border-black/10 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.16)] md:left-[276px] md:right-auto md:top-[72px] md:w-[min(820px,calc(100vw-300px))] md:p-5"
          id="admin-create-menu"
          role="menu"
          aria-label="Create menu"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {createMenuGroups.map((group) => (
              <section key={group.title}>
                <h2 className="text-xs font-semibold uppercase tracking-[0.1em] text-industrial-muted">
                  {group.title}
                </h2>
                <div className="mt-3 grid gap-1">
                  {group.items.map((item) => (
                    <Link
                      className="rounded-md px-2 py-2 text-sm font-medium leading-5 text-industrial-ink transition hover:bg-[#f7f7f4] focus:bg-[#f7f7f4] focus:outline-none focus:ring-2 focus:ring-[#235b4b]/25"
                      href={item.href}
                      key={item.label}
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        setIsMobileNavOpen(false);
                      }}
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-h-[100dvh] flex-1 overflow-y-auto bg-white">
        <header className="sticky top-0 z-10 border-b border-black/10 bg-white">
          <div className="flex h-14 items-center justify-between px-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-industrial-ink">
                {activeItem ? activeItem.label : "Operations"}
              </p>
            </div>
            <span className="hidden rounded-md border border-black/10 bg-[#f7f7f4] px-2 py-1 text-xs font-medium text-industrial-muted md:inline-flex">
              {pathname}
            </span>
          </div>
        </header>

        <main className="w-full bg-[#fbfbf8] px-5 py-5">{children}</main>
        <AdminOrderBootstrap />
      </div>
    </div>
  );
}
