// Wayfinder admin — back-office shell. A warehouse operations console: a black
// aisle-map context rail on top and a fixed dark sidebar. The sidebar leads
// with quick-create actions, then grouped navigation with live alert badges,
// and closes with an operator chip. Storefront chrome is suppressed for
// /admin/*, so this is the only chrome for the back-office.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Ico, monoFont, sansFont, wf, wfFontVars } from "../kit";
import { alertCountForHref, useAdminAlerts } from "@/lib/admin-alerts";

type NavItem = {
  href: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
};

type NavGroup = { heading: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    heading: "Operations",
    items: [
      { href: "/admin", label: "Dashboard", icon: Ico.grid },
      { href: "/admin/orders", label: "Orders", icon: Ico.clipboard },
      { href: "/admin/quotes", label: "Quotes", icon: Ico.receipt },
      { href: "/admin/reports", label: "Reports", icon: Ico.map }
    ]
  },
  {
    heading: "Catalog & stock",
    items: [
      { href: "/admin/catalog", label: "Catalog", icon: Ico.grid },
      { href: "/admin/products", label: "Products", icon: Ico.cart },
      { href: "/admin/inventory", label: "Inventory", icon: Ico.clipboard },
      { href: "/admin/procurement", label: "Procurement", icon: Ico.truck }
    ]
  },
  {
    heading: "Floor",
    items: [
      { href: "/admin/customers", label: "Customers", icon: Ico.user },
      { href: "/admin/pick-tickets", label: "Pick tickets", icon: Ico.clipboard },
      { href: "/admin/warehouse", label: "Warehouse", icon: Ico.truck },
      { href: "/admin/demand", label: "Demand", icon: Ico.map }
    ]
  }
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WayfinderAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/admin";
  const [navOpen, setNavOpen] = useState(false);
  const alerts = useAdminAlerts();

  const sidebar = (
    <aside
      style={{
        width: 248,
        flexShrink: 0,
        background: wf.ink,
        color: "#fff",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "15px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.09)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12
        }}
      >
        <Link
          href="/admin"
          style={{ display: "flex", alignItems: "center", gap: 9 }}
          onClick={() => setNavOpen(false)}
        >
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 30,
              height: 30,
              background: wf.safety,
              color: wf.ink
            }}
          >
            <Ico.pin size={17} />
          </span>
          <span style={{ display: "grid", lineHeight: 1.15 }}>
            <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: "0.01em" }}>
              Wayfinder
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: "0.16em",
                color: "rgba(255,255,255,0.5)",
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

      {/* Quick create */}
      <div
        style={{
          padding: "12px 12px 10px",
          display: "grid",
          gap: 7,
          borderBottom: "1px solid rgba(255,255,255,0.09)"
        }}
      >
        <Link href="/admin/orders/new" onClick={() => setNavOpen(false)} className="wf-qa wf-qa-primary">
          <Ico.plus size={15} /> New order
        </Link>
        <Link href="/admin/products/new" onClick={() => setNavOpen(false)} className="wf-qa wf-qa-ghost">
          <Ico.plus size={14} /> Add product or service
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {NAV.map((group) => (
          <div key={group.heading} style={{ marginBottom: 16 }}>
            <p
              style={{
                margin: "0 0 6px",
                padding: "0 8px",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.38)"
              }}
            >
              {group.heading}
            </p>
            <div style={{ display: "grid", gap: 2 }}>
              {group.items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                // Wayfinder keeps customer POs inside the Quotes page, so its
                // Quotes badge also carries the pending-PO count.
                const navCount =
                  alertCountForHref(item.href, alerts) +
                  (item.href === "/admin/quotes" ? alerts.pendingPOs : 0);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setNavOpen(false)}
                    className={active ? "wf-nav-item wf-nav-active" : "wf-nav-item"}
                  >
                    <span
                      style={{
                        width: 3,
                        alignSelf: "stretch",
                        background: active ? wf.safety : "transparent"
                      }}
                    />
                    <Icon size={16} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700 }}>
                      {item.label}
                    </span>
                    {navCount > 0 ? (
                      <span
                        title="Needs attention"
                        style={{
                          display: "inline-grid",
                          placeItems: "center",
                          minWidth: 17,
                          height: 17,
                          padding: "0 5px",
                          background: wf.safety,
                          color: wf.ink,
                          fontSize: 9,
                          fontWeight: 900,
                          fontFamily: monoFont
                        }}
                      >
                        {navCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Operator + storefront link */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.09)",
          padding: 12,
          display: "grid",
          gap: 8
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              color: "#fff"
            }}
          >
            <Ico.user size={16} />
          </span>
          <span style={{ display: "grid", lineHeight: 1.25, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 800 }}>Counter staff</span>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase"
              }}
            >
              Bakersfield warehouse
            </span>
          </span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Link href="/" className="wf-foot-link">
            Storefront
          </Link>
          <a href="/admin/logout" className="wf-foot-link">
            Sign out
          </a>
        </div>
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
          <span style={{ color: wf.safety }}>Will-call cutoff 11A</span>
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
        {navOpen ? (
          <div
            onClick={() => setNavOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40 }}
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

      <style>{`
        .wf-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 9px 8px 0;
          color: rgba(255,255,255,0.74);
          transition: background 120ms ease, color 120ms ease;
        }
        .wf-nav-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
        .wf-nav-active { background: #fff; color: ${wf.ink}; }
        .wf-nav-active:hover { background: #fff; color: ${wf.ink}; }
        .wf-qa {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          height: 36px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: background 120ms ease, border-color 120ms ease;
        }
        .wf-qa-primary { background: ${wf.safety}; color: ${wf.ink}; }
        .wf-qa-primary:hover { background: #ffb52e; }
        .wf-qa-ghost {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.22);
        }
        .wf-qa-ghost:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.4); }
        .wf-foot-link {
          flex: 1;
          text-align: center;
          padding: 7px 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.62);
          border: 1px solid rgba(255,255,255,0.14);
          transition: background 120ms ease, color 120ms ease;
        }
        .wf-foot-link:hover { background: rgba(255,255,255,0.08); color: #fff; }
        @media (max-width: 880px) {
          .wf-admin-sidebar { position: fixed; inset: 0 auto 0 0; z-index: 50; display: none; }
          .wf-admin-navtoggle { display: inline-flex !important; }
          .wf-admin-navclose { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}
