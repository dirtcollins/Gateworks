"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ClipboardList,
  CreditCard,
  FilePlus2,
  Heart,
  Home,
  PlusCircle,
  Search,
  ShoppingBag,
  Sparkles,
  User
} from "lucide-react";
import { GateworksLogo } from "@/components/gateworks-logo";
import { useCartStore } from "@/lib/cart-store";
import { useUserStore } from "@/lib/user-store";
import { cn } from "@/lib/utils";

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

export function SiteHeader() {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [cartPulseKey, setCartPulseKey] = useState(0);
  const createDesktopButtonRef = useRef<HTMLButtonElement>(null);
  const createMobileButtonRef = useRef<HTMLButtonElement>(null);
  const createMenuRef = useRef<HTMLDivElement>(null);
  const previousCartQuantityRef = useRef(0);
  const cartQuantity = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0)
  );

  useEffect(() => {
    if (!isCreateMenuOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        createMenuRef.current?.contains(target) ||
        createDesktopButtonRef.current?.contains(target) ||
        createMobileButtonRef.current?.contains(target)
      ) {
        return;
      }

      setIsCreateMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCreateMenuOpen(false);
        (createDesktopButtonRef.current || createMobileButtonRef.current)?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isCreateMenuOpen]);

  useEffect(() => {
    if (cartQuantity > previousCartQuantityRef.current) {
      setCartPulseKey((value) => value + 1);
    }

    previousCartQuantityRef.current = cartQuantity;
  }, [cartQuantity]);

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f7f7f4] px-2 py-2 text-industrial-ink lg:h-screen lg:border-b-0 lg:border-r">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 lg:h-full lg:flex-col lg:items-stretch">
        <Link
          className="flex h-11 shrink-0 items-center rounded-lg px-2 transition hover:bg-[#efeee9] lg:mb-1"
          href="/"
        >
          <GateworksLogo className="h-7 w-[156px]" height={28} width={156} priority />
        </Link>

        <button
          ref={createDesktopButtonRef}
          aria-controls="site-create-menu"
          aria-expanded={isCreateMenuOpen}
          className="hidden h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-industrial-steel transition hover:bg-[#efeee9] hover:text-industrial-ink focus:outline-none focus:ring-2 focus:ring-[#235b4b]/20 lg:flex"
          onClick={() => setIsCreateMenuOpen((value) => !value)}
          type="button"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-[#235b4b] text-white">
            <PlusCircle size={16} aria-hidden="true" strokeWidth={2.2} />
          </span>
          <span>Create</span>
        </button>

        <form className="relative min-w-0 flex-1 lg:flex-none" action="/search">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
          <input
            aria-label="Search Gateworks"
            className="h-10 w-full rounded-lg border border-black/10 bg-white pl-9 pr-10 text-sm text-industrial-ink outline-none transition placeholder:text-industrial-muted focus:border-black/20"
            name="q"
            placeholder="Search Gateworks"
            type="search"
          />
          <button
            aria-label="Search"
            className="absolute right-1 top-1 grid size-8 place-items-center rounded-md text-industrial-muted transition hover:bg-black/[0.05] hover:text-industrial-ink"
            type="submit"
          >
            <Search size={15} />
          </button>
        </form>

        <nav className="hidden flex-1 flex-col gap-1 pt-3 lg:flex">
          {[
            { href: "/", label: "Products", Icon: Home },
            { href: "/lists", label: "Saved lists", Icon: Heart },
            { href: "/quote", label: "Build quote", Icon: FilePlus2 },
            { href: "/quotes", label: "Quote history", Icon: ClipboardList },
            { href: "/cart", label: "Cart", Icon: ShoppingBag },
            { href: "/checkout", label: "Checkout", Icon: CreditCard },
            {
              href: "/account",
              label: isAuthenticated ? "Account" : "Sign in",
              Icon: User
            },
            { href: "/admin", label: "Operations", Icon: Sparkles }
          ].map(({ href, label, Icon }) => {
            const isCart = href === "/cart";

            return (
              <Link
                key={href}
                className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-industrial-steel transition hover:bg-[#efeee9] hover:text-industrial-ink"
                href={href}
              >
                <span className="relative grid size-5 place-items-center">
                  <Icon
                    className={cn(isCart && cartPulseKey ? "animate-cart-bump" : "")}
                    key={isCart ? `cart-icon-${cartPulseKey}` : undefined}
                    size={17}
                  />
                </span>
                <span>{label}</span>
                {isCart && cartQuantity > 0 ? (
                  <span
                    key={`cart-count-${cartPulseKey}`}
                    className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-industrial-ink px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white animate-cart-badge"
                  >
                    {cartQuantity > 99 ? "99+" : cartQuantity}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <nav className="flex items-center justify-end gap-1 lg:hidden">
          {[
            { href: "/", label: "Open products", Icon: Home },
            { href: "/lists", label: "Open lists", Icon: Heart },
            { href: "/quote", label: "Build quote", Icon: FilePlus2 },
            { href: "/cart", label: "Open cart", Icon: ShoppingBag },
            { href: "/account", label: "Open account", Icon: User }
          ].map(({ href, label, Icon }) => {
            const isCart = href === "/cart";

            return (
              <Link
                key={href}
                aria-label={label}
                className="relative grid size-10 place-items-center rounded-lg border border-black/10 bg-white/80 text-industrial-ink shadow-sm transition hover:bg-white"
                href={href}
              >
                <Icon
                  className={cn(isCart && cartPulseKey ? "animate-cart-bump" : "")}
                  key={isCart ? `mobile-cart-icon-${cartPulseKey}` : undefined}
                  size={19}
                />
                {isCart && cartQuantity > 0 ? (
                  <span
                    key={`mobile-cart-count-${cartPulseKey}`}
                    className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-industrial-ink px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white animate-cart-badge"
                  >
                    {cartQuantity > 99 ? "99+" : cartQuantity}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <button
            ref={createMobileButtonRef}
            aria-controls="site-create-menu"
            aria-expanded={isCreateMenuOpen}
            aria-label="Create"
            className="grid size-10 place-items-center rounded-lg border border-[#235b4b]/20 bg-[#235b4b] text-white shadow-sm transition hover:bg-[#1f4f42]"
            onClick={() => setIsCreateMenuOpen((value) => !value)}
            type="button"
          >
            <PlusCircle size={20} />
          </button>
        </nav>

        <div className="mt-auto hidden px-3 py-3 lg:block">
          <p className="text-xs font-semibold text-industrial-ink">Gateworks workspace</p>
          <p className="mt-1 text-xs leading-5 text-industrial-muted">
            Contractor products, quotes, carts, and operations in one window.
          </p>
        </div>
      </div>

      {isCreateMenuOpen ? (
        <div
          ref={createMenuRef}
          className="fixed left-3 right-3 top-[68px] z-50 rounded-lg border border-black/10 bg-white p-3 shadow-[0_18px_48px_rgba(15,23,42,0.16)] lg:left-[260px] lg:right-auto lg:top-[68px] lg:w-[min(760px,calc(100vw-284px))] lg:p-4"
          id="site-create-menu"
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
                      onClick={() => setIsCreateMenuOpen(false)}
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
    </header>
  );
}
