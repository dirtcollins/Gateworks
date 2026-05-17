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
  Moon,
  Package,
  PlusCircle,
  Search,
  Sun,
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

type SidebarColorMode = "light" | "dark";

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
  const [sidebarColorMode, setSidebarColorMode] = useState<SidebarColorMode>("light");
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const isDarkSidebar = sidebarColorMode === "dark";

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
    const savedMode = window.localStorage.getItem("gateworks-admin-sidebar-mode");

    if (savedMode === "light" || savedMode === "dark") {
      setSidebarColorMode(savedMode);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("gateworks-admin-sidebar-mode", sidebarColorMode);
  }, [sidebarColorMode]);

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
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r px-2 py-2 transition-transform duration-150 md:static md:inset-auto md:translate-x-0 ${
          isDarkSidebar
            ? "border-white/10 bg-[#171b1c] text-white"
            : "border-black/10 bg-[#f7f7f4] text-industrial-ink"
        } ${
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Admin navigation"
      >
        <div className="flex h-11 items-center justify-between px-2">
          <Link
            className={`flex min-w-0 items-center rounded-md px-1 py-1 transition ${
              isDarkSidebar ? "hover:bg-white/10" : "hover:bg-[#efeee9]"
            }`}
            href="/admin"
            onClick={() => setIsMobileNavOpen(false)}
            aria-label="Gateworks admin dashboard"
          >
            <img
              alt="Gateworks"
              className="block h-7 w-[156px] object-contain object-left"
              src="/assets/logo.svg"
            />
          </Link>
          <button
            className={`rounded-lg border p-2 transition md:hidden ${
              isDarkSidebar
                ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                : "border-black/10 bg-white text-industrial-ink hover:bg-[#efeee9]"
            }`}
            onClick={() => setIsMobileNavOpen(false)}
            type="button"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-1 grid gap-1.5 px-1">
          <button
            ref={createButtonRef}
            aria-controls="admin-create-menu"
            aria-expanded={isCreateMenuOpen}
            className={`flex h-10 items-center gap-2 rounded-lg border px-2.5 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#235b4b]/20 ${
              isDarkSidebar
                ? "border-white/10 bg-white/[0.08] text-white hover:bg-white/[0.12]"
                : "border-black/10 bg-white text-industrial-ink hover:bg-[#fbfbf8]"
            }`}
            onClick={() => setIsCreateMenuOpen((value) => !value)}
            type="button"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#235b4b] text-white">
              <PlusCircle size={16} aria-hidden="true" strokeWidth={2.2} />
            </span>
            <span>Create</span>
          </button>

          <label className="relative">
            <span className="sr-only">Search operations</span>
            <Search
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
                isDarkSidebar ? "text-white/45" : "text-industrial-muted"
              }`}
              size={15}
            />
            <input
              className={`h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none transition ${
                isDarkSidebar
                  ? "border-white/10 bg-white/[0.08] text-white placeholder:text-white/45 focus:border-white/25"
                  : "border-black/10 bg-white text-industrial-ink placeholder:text-industrial-muted focus:border-black/20"
              }`}
              placeholder="Search operations"
              type="search"
            />
          </label>
        </div>

        <p
          className={`mb-1.5 mt-4 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] ${
            isDarkSidebar ? "text-white/45" : "text-industrial-muted"
          }`}
        >
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
                      isActive
                        ? isDarkSidebar
                          ? "border-white/10 bg-white/10 text-white"
                          : "border-black/10 bg-white text-industrial-ink"
                        : isDarkSidebar
                          ? "text-white/45"
                          : "text-industrial-muted"
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
                        ? isDarkSidebar
                          ? "border-white/10 bg-white/[0.12] text-white shadow-sm"
                          : "border-black/10 bg-white text-industrial-ink shadow-sm"
                        : isDarkSidebar
                          ? "border-transparent text-white/70 hover:bg-white/[0.08] hover:text-white"
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
          <div
            className={`grid grid-cols-2 rounded-lg border p-1 ${
              isDarkSidebar ? "border-white/10 bg-black/20" : "border-black/10 bg-white"
            }`}
            aria-label="Sidebar color mode"
          >
            <button
              className={`grid h-8 place-items-center rounded-md transition ${
                !isDarkSidebar
                  ? "bg-[#235b4b] text-white shadow-sm"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setSidebarColorMode("light")}
              title="Light sidebar"
              type="button"
              aria-label="Use light sidebar"
              aria-pressed={!isDarkSidebar}
            >
              <Sun size={16} aria-hidden="true" />
            </button>
            <button
              className={`grid h-8 place-items-center rounded-md transition ${
                isDarkSidebar
                  ? "bg-white text-[#171b1c] shadow-sm"
                  : "text-industrial-muted hover:bg-[#efeee9] hover:text-industrial-ink"
              }`}
              onClick={() => setSidebarColorMode("dark")}
              title="Dark sidebar"
              type="button"
              aria-label="Use dark sidebar"
              aria-pressed={isDarkSidebar}
            >
              <Moon size={16} aria-hidden="true" />
            </button>
          </div>
          <p className={`mt-3 text-xs font-medium ${isDarkSidebar ? "text-white" : "text-industrial-ink"}`}>
            Gateworks Operations
          </p>
          <p className={`mt-1 text-xs leading-5 ${isDarkSidebar ? "text-white/50" : "text-industrial-muted"}`}>
            Orders, quotes, inventory, and fulfillment.
          </p>
        </div>
      </aside>

      {isMobileNavOpen ? (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/25 md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        />
      ) : null}

      {isCreateMenuOpen ? (
        <div
          ref={createMenuRef}
          className="fixed left-3 right-3 top-[104px] z-50 rounded-lg border border-black/10 bg-white p-3 shadow-[0_18px_48px_rgba(15,23,42,0.16)] md:left-[260px] md:right-auto md:top-[64px] md:w-[min(760px,calc(100vw-284px))] md:p-4"
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
          <div className="flex h-11 items-center justify-between px-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-industrial-ink">
                {activeItem ? activeItem.label : "Operations"}
              </p>
            </div>
          </div>
        </header>

        <main className="w-full bg-[#fbfbf8] px-3 py-3 md:px-4 md:py-4">{children}</main>
        <AdminOrderBootstrap />
      </div>
    </div>
  );
}
