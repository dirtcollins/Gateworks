// Wayfinder admin — back-office shell. A warehouse operations console: black
// aisle-map context rail on top, fixed sidebar nav on the left. Covers Wave 3
// sections (dashboard, orders, quotes, reports) and links the Wave 4 sections
// (catalog, products, inventory, customers, warehouse) which arrive later.
// The app's global chrome is suppressed for /wayfinder/*, so this is the only
// chrome for /wayfinder/admin/*.
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Ico, monoFont, sansFont, wf, wfFontVars } from "../kit";

type NavItem = {
  href: string;
  label: string;
  code: string;
  icon: (p: { size?: number }) => ReactNode;
  soon?: boolean;
};

type NavGroup = { heading: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    heading: "Operations",
    items: [
      { href: "/wayfinder/admin", label: "Dashboard", code: "OPS", icon: Ico.grid },
      { href: "/wayfinder/admin/orders", label: "Orders", code: "ORD", icon: Ico.clipboard },
      { href: "/wayfinder/admin/quotes", label: "Quotes", code: "QTE", icon: Ico.receipt },
      { href: "/wayfinder/admin/reports", label: "Reports", code: "RPT", icon: Ico.map }
    ]
  },
  {
    heading: "Catalog & Stock",
    items: [
      {
        href: "/wayfinder/admin/catalog",
        label: "Catalog",
        code: "CAT",
        icon: Ico.grid
      },
      {
        href: "/wayfinder/admin/products",
        label: "Products",
        code: "PRD",
        icon: Ico.cart
      },
      {
        href: "/wayfinder/admin/inventory",
        label: "Inventory",
        code: "INV",
        icon: Ico.clipboard
      }
    ]
  },
  {
    heading: "Floor",
    items: [
      {
        href: "/wayfinder/admin/customers",
        label: "Customers",
        code: "CUS",
        icon: Ico.user,
        soon: true
      },
      {
        href: "/wayfinder/admin/warehouse",
        label: "Warehouse",
        code: "WHS",
        icon: Ico.truck,
        soon: true
      }
    ]
  }
];

function isActive(pathname: string, href: string) {
  if (href === "/wayfinder/admin") return pathname === "/wayfinder/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WayfinderAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/wayfinder/admin";
  const [navOpen, setNavOpen] = useState(false);

  const sidebar = (
    <aside
      style={{
        width: 244,
        flexShrink: 0,
        background: wf.ink,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${wf.ink}`
      }}
    >
      <div
        style={{
          padding: "16px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <Link
          href="/wayfinder/admin"
          style={{ display: "flex", alignItems: "center", gap: 8 }}
          onClick={() => setNavOpen(false)}
        >
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 28,
              height: 28,
              background: wf.safety,
              color: wf.ink
            }}
          >
            <Ico.pin size={16} />
          </span>
          <span style={{ display: "grid", lineHeight: 1.1 }}>
            <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: "0.02em" }}>
              Wayfinder
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase"
              }}
            >
              Operations
            </span>
          </span>
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setNavOpen(false)}
          style={{
            display: "none",
            background: "none",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff",
            padding: 5,
            cursor: "pointer"
          }}
          className="wf-admin-navclose"
        >
          <Ico.x size={14} />
        </button>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {NAV.map((group) => (
          <div key={group.heading} style={{ marginBottom: 14 }}>
            <p
              style={{
                margin: "0 0 6px",
                padding: "0 8px",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)"
              }}
            >
              {group.heading}
            </p>
            <div style={{ display: "grid", gap: 2 }}>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 8px",
                      color: active ? wf.ink : "rgba(255,255,255,0.78)",
                      background: active ? "#fff" : "transparent",
                      borderLeft: `2px solid ${active ? wf.safety : "transparent"}`
                    }}
                  >
                    <Icon size={16} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{item.label}</span>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: 9,
                        letterSpacing: "0.08em",
                        color: item.soon
                          ? "rgba(255,255,255,0.35)"
                          : active
                            ? wf.muted
                            : "rgba(255,255,255,0.45)"
                      }}
                    >
                      {item.soon ? "SOON" : item.code}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        style={{
          padding: "12px 18px",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          fontFamily: monoFont,
          fontSize: 10,
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.5)"
        }}
      >
        Bakersfield Warehouse
        <br />
        48 aisles · Bay 7 will-call
        <br />
        <Link href="/wayfinder" style={{ color: wf.safety }}>
          ← Back to storefront
        </Link>
      </div>
    </aside>
  );

  return (
    <div
      className={wfFontVars}
      style={{
        fontFamily: sansFont,
        background: wf.paper,
        color: wf.ink,
        minHeight: "100vh"
      }}
    >
      {/* Black aisle-map context rail */}
      <div
        style={{
          background: wf.ink,
          color: "#fff",
          padding: "6px 18px",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap"
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
            className="wf-admin-navtoggle"
            style={{
              display: "none",
              background: "none",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              padding: 4,
              cursor: "pointer"
            }}
          >
            <Ico.grid size={13} />
          </button>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Ico.map size={12} /> Operations console
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
          <span style={{ color: wf.amber }}>Will-call cutoff 11A</span>
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,0.7)"
          }}
        >
          <Ico.user size={12} /> Counter staff
        </span>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 30px)" }}>
        {/* Mobile drawer overlay */}
        {navOpen ? (
          <div
            onClick={() => setNavOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 40
            }}
            aria-hidden
          />
        ) : null}
        <div
          className="wf-admin-sidebar"
          style={{
            position: navOpen ? "fixed" : "static",
            inset: navOpen ? "0 auto 0 0" : undefined,
            zIndex: navOpen ? 50 : undefined,
            display: navOpen ? "flex" : undefined
          }}
        >
          {sidebar}
        </div>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "20px 22px 48px",
            display: "grid",
            gap: 18,
            alignContent: "start"
          }}
        >
          {children}
        </main>
      </div>

      {/* Responsive: collapse the sidebar to a drawer below 880px. */}
      <style>{`
        @media (max-width: 880px) {
          .wf-admin-sidebar { position: fixed; inset: 0 auto 0 0; z-index: 50; display: none; }
          .wf-admin-navtoggle { display: inline-flex !important; }
          .wf-admin-navclose { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}
