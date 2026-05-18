// Wayfinder admin — back-office shell. A modern operations console: a thin
// dark utility rail on top and a light, full-height sidebar pinned to the
// viewport. The sidebar leads with quick-create actions, then grouped
// navigation with live alert badges, and closes with an operator chip. Themed
// with the "Ledger" palette (admin-theme.ts). Storefront chrome is suppressed
// for /admin/*, so this is the only chrome.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type CSSProperties, type ReactNode } from "react";
import { Ico, monoFont, sansFont, wfFontVars } from "../kit";
import { RADIUS_SM, wf } from "./admin-theme";
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

const RAIL_HEIGHT = 30;

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WayfinderAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/admin";
  const [navOpen, setNavOpen] = useState(false);
  const alerts = useAdminAlerts();

  // Pinned full-height on desktop; a fixed drawer on mobile.
  const wrapperStyle: CSSProperties = navOpen
    ? { position: "fixed", inset: `0 auto 0 0`, zIndex: 50, display: "flex" }
    : {
        position: "sticky",
        top: 0,
        alignSelf: "flex-start",
        height: `calc(100vh - ${RAIL_HEIGHT}px)`
      };

  const sidebar = (
    <aside
      style={{
        width: 256,
        flexShrink: 0,
        height: "100%",
        background: "#fff",
        color: wf.ink,
        borderRight: `1px solid ${wf.rail}`,
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: "15px 16px",
          borderBottom: `1px solid ${wf.hairline}`,
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
              borderRadius: 9,
              background: wf.safety,
              color: "#fff"
            }}
          >
            <Ico.pin size={16} />
          </span>
          <span style={{ display: "grid", lineHeight: 1.15 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: wf.ink }}>Gateworks</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.18em",
                color: wf.muted,
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
            border: `1px solid ${wf.rail}`,
            borderRadius: 8,
            color: wf.ink,
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
          borderBottom: `1px solid ${wf.hairline}`
        }}
      >
        <Link
          href="/admin/orders/new"
          onClick={() => setNavOpen(false)}
          className="wf-qa wf-qa-primary"
        >
          <Ico.plus size={15} /> New order
        </Link>
        <Link
          href="/admin/products/new"
          onClick={() => setNavOpen(false)}
          className="wf-qa wf-qa-ghost"
        >
          <Ico.plus size={14} /> Add product or service
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
        {NAV.map((group) => (
          <div key={group.heading} style={{ marginBottom: 18 }}>
            <p
              style={{
                margin: "0 0 7px",
                padding: "0 8px",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: wf.muted
              }}
            >
              {group.heading}
            </p>
            <div style={{ display: "grid", gap: 3 }}>
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
                    <Icon size={17} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: active ? 600 : 500 }}>
                      {item.label}
                    </span>
                    {navCount > 0 ? (
                      <span
                        title="Needs attention"
                        style={{
                          display: "inline-grid",
                          placeItems: "center",
                          minWidth: 18,
                          height: 18,
                          padding: "0 5px",
                          borderRadius: 999,
                          background: wf.safety,
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 700,
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
          borderTop: `1px solid ${wf.hairline}`,
          background: wf.bone,
          padding: 12,
          display: "grid",
          gap: 9
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#fff",
              border: `1px solid ${wf.rail}`,
              color: wf.steel
            }}
          >
            <Ico.user size={16} />
          </span>
          <span style={{ display: "grid", lineHeight: 1.3, minWidth: 0 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: wf.ink }}>
              Counter staff
            </span>
            <span style={{ fontSize: 11, color: wf.muted }}>Bakersfield warehouse</span>
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
      {/* Thin dark utility rail */}
      <div
        style={{
          height: RAIL_HEIGHT,
          background: wf.ink,
          color: "#fff",
          padding: "0 18px",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.02em",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
            className="wf-admin-navtoggle"
            style={{
              display: "none",
              background: "none",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 7,
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
          <span style={{ color: "#aab1ff" }}>Will-call cutoff 11A</span>
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "rgba(255,255,255,0.62)"
          }}
        >
          <Ico.user size={12} /> Counter staff
        </span>
      </div>

      <div style={{ display: "flex", minHeight: `calc(100vh - ${RAIL_HEIGHT}px)` }}>
        {navOpen ? (
          <div
            onClick={() => setNavOpen(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(21,24,31,0.4)", zIndex: 40 }}
            aria-hidden
          />
        ) : null}
        <div className="wf-admin-sidebar" style={wrapperStyle}>
          {sidebar}
        </div>

        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "22px 24px 52px",
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
          padding: 9px 10px 9px 0;
          border-radius: ${RADIUS_SM}px;
          overflow: hidden;
          color: ${wf.steel};
          transition: background 120ms ease, color 120ms ease;
        }
        .wf-nav-item:hover { background: ${wf.bone}; color: ${wf.ink}; }
        .wf-nav-active { background: ${wf.indigoSoft}; color: ${wf.ink}; }
        .wf-nav-active:hover { background: ${wf.indigoSoft}; color: ${wf.ink}; }
        .wf-qa {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          height: 38px;
          font-size: 13px;
          font-weight: 600;
          border-radius: ${RADIUS_SM}px;
          transition: background 120ms ease, border-color 120ms ease;
        }
        .wf-qa-primary { background: ${wf.control}; color: #fff; }
        .wf-qa-primary:hover { background: #27308c; }
        .wf-qa-ghost {
          background: #fff;
          color: ${wf.ink};
          border: 1px solid ${wf.rail};
        }
        .wf-qa-ghost:hover { background: ${wf.bone}; border-color: ${wf.muted}; }
        .wf-foot-link {
          flex: 1;
          text-align: center;
          padding: 8px;
          font-size: 11px;
          font-weight: 600;
          border-radius: ${RADIUS_SM}px;
          color: ${wf.steel};
          background: #fff;
          border: 1px solid ${wf.rail};
          transition: background 120ms ease, color 120ms ease;
        }
        .wf-foot-link:hover { background: ${wf.bone}; color: ${wf.ink}; }
        .wf-trow { transition: background 100ms ease; }
        .wf-trow:hover { background: ${wf.bone}; }
        .wf-field:focus { border-color: ${wf.safety}; box-shadow: 0 0 0 3px rgba(47,58,163,0.13); }
        .wf-abtn-default:hover, .wf-abtn-ghost:hover { background: ${wf.bone}; border-color: ${wf.muted}; }
        .wf-abtn-primary:hover { background: #27308c; border-color: #27308c; }
        .wf-abtn-danger:hover { background: ${wf.roseSoft}; }
        .wf-abtn:disabled { cursor: default; box-shadow: none; }
        @media (max-width: 880px) {
          .wf-admin-sidebar { position: fixed; inset: 0 auto 0 0; z-index: 50; display: none; height: 100vh; }
          .wf-admin-navtoggle { display: inline-flex !important; }
          .wf-admin-navclose { display: inline-flex !important; }
        }
      `}</style>
    </div>
  );
}
