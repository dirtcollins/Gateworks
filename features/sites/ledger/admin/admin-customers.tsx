"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Search,
  Users
} from "lucide-react";
import { LEDGER, formatUsd, formatUsd0 } from "@/features/sites/ledger/kit";
import { customerDirectory, type CustomerRecord } from "@/lib/customers";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import {
  AdminCard,
  AdminEmpty,
  AdminHeading,
  StatTile,
  StatusPill,
  formatAdminDate,
  orderStatusTone,
  titleCase
} from "./admin-kit";

/* ------------------------------------------------------------------ *
 * LEDGER — admin / customers
 * Customer directory built on the real `customerDirectory` records
 * merged with people who actually registered (GET /api/site-users),
 * cross-referenced with the live order store so each account shows
 * genuine spend, order count, and recent purchase history. Searchable
 * list on the left, a detail panel on the right.
 * ------------------------------------------------------------------ */

type CustomerStats = {
  orders: OrderRecord[];
  orderCount: number;
  lifetimeValue: number;
  openValue: number;
  lastOrderAt: string | null;
};

type SiteUser = { id: string; displayName: string; lastUsedAt: string };

/* A registered site user with no directory entry becomes a synthetic
 * CustomerRecord so it surfaces alongside the static directory. */
function siteUserToCustomer(user: SiteUser): CustomerRecord {
  return {
    id: `site-user:${user.id}`,
    name: user.displayName,
    company: user.displayName,
    email: "",
    phone: "",
    billingAddress: "No billing address on file",
    jobsiteAddress: "No jobsite address on file",
    terms: "Registered account"
  };
}

const OPEN_STATUSES = [
  "submitted",
  "confirmed",
  "picking",
  "ready_for_pickup",
  "out_for_delivery"
];

/* An order belongs to a customer if the company name matches the
 * directory company, the email matches, or — for synthetic registered
 * accounts — the order userId matches. Falls back gracefully. */
function ordersForCustomer(customer: CustomerRecord, orders: OrderRecord[]) {
  const company = customer.company.trim().toLowerCase();
  const email = customer.email.trim().toLowerCase();
  const siteUserId = customer.id.startsWith("site-user:")
    ? customer.id.slice("site-user:".length)
    : "";
  return orders.filter((order) => {
    const orderCompany = (order.companyName || "").trim().toLowerCase();
    const orderEmail = (order.email || "").trim().toLowerCase();
    return (
      (company && orderCompany === company) ||
      (email && orderEmail === email) ||
      (siteUserId && order.userId === siteUserId)
    );
  });
}

function buildStats(customer: CustomerRecord, orders: OrderRecord[]): CustomerStats {
  const matched = ordersForCustomer(customer, orders).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  const lifetimeValue = matched
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.total, 0);
  const openValue = matched
    .filter((order) => OPEN_STATUSES.includes(order.status))
    .reduce((sum, order) => sum + order.total, 0);
  return {
    orders: matched,
    orderCount: matched.length,
    lifetimeValue,
    openValue,
    lastOrderAt: matched[0]?.createdAt ?? null
  };
}

export function LedgerAdminCustomers() {
  const storeOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(customerDirectory[0]?.id ?? "");
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          orders?: OrderRecord[];
          persisted?: boolean;
        };
        if (mounted && payload.persisted && payload.orders) {
          setOrders(payload.orders);
        }
      } catch {
        /* Local store data remains in place. */
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [setOrders]);

  useEffect(() => {
    let mounted = true;
    async function loadUsers() {
      try {
        const response = await fetch("/api/site-users", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { users?: SiteUser[] };
        if (mounted && payload.users) setSiteUsers(payload.users);
      } catch {
        /* Directory still renders without registered accounts. */
      }
    }
    void loadUsers();
    return () => {
      mounted = false;
    };
  }, []);

  const orders = useMemo(
    () => storeOrders.filter((order) => !order.isQuoteRequest),
    [storeOrders]
  );

  /* Static directory plus any registered account not already covered by
   * a directory entry (matched on a normalized name). */
  const allCustomers = useMemo(() => {
    const directoryNames = new Set(
      customerDirectory.flatMap((entry) => [
        entry.name.trim().toLowerCase(),
        entry.company.trim().toLowerCase()
      ])
    );
    const extras = siteUsers
      .filter(
        (user) =>
          user.id !== "guest" &&
          !directoryNames.has(user.displayName.trim().toLowerCase())
      )
      .map(siteUserToCustomer);
    // Collapse to one row per id so table keys stay unique when a registered
    // account shares an id with a directory entry.
    const byId = new Map(
      [...customerDirectory, ...extras].map((entry) => [entry.id, entry] as const)
    );
    return Array.from(byId.values());
  }, [siteUsers]);

  const enriched = useMemo(
    () =>
      allCustomers.map((customer) => ({
        customer,
        stats: buildStats(customer, orders)
      })),
    [allCustomers, orders]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return enriched;
    return enriched.filter(
      ({ customer }) =>
        customer.name.toLowerCase().includes(normalized) ||
        customer.company.toLowerCase().includes(normalized) ||
        customer.email.toLowerCase().includes(normalized)
    );
  }, [enriched, query]);

  useEffect(() => {
    if (!filtered.length) return;
    if (!filtered.some((entry) => entry.customer.id === selectedId)) {
      setSelectedId(filtered[0].customer.id);
    }
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => enriched.find((entry) => entry.customer.id === selectedId) ?? enriched[0],
    [enriched, selectedId]
  );

  const totals = useMemo(() => {
    const lifetime = enriched.reduce((sum, entry) => sum + entry.stats.lifetimeValue, 0);
    const withActivity = enriched.filter((entry) => entry.stats.orderCount > 0).length;
    return { accounts: enriched.length, lifetime, withActivity };
  }, [enriched]);

  return (
    <div className="grid gap-6">
      <AdminHeading
        eyebrow="Operations"
        title="Customers"
        description="The account directory — contact details, terms, and spend across every order in the workspace."
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Accounts" value={String(totals.accounts)} sub="In directory" />
        <StatTile
          label="Lifetime value"
          value={formatUsd0(totals.lifetime)}
          sub="Across all accounts"
        />
        <StatTile
          label="With activity"
          value={String(totals.withActivity)}
          sub="Placed at least one order"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* Directory list */}
        <AdminCard>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 m-4"
            style={{ border: `1px solid ${LEDGER.line}` }}
          >
            <Search className="h-4 w-4" style={{ color: LEDGER.muted }} />
            <input
              aria-label="Search customers"
              className="w-full bg-transparent text-[13px] outline-none"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, company, or email"
              style={{ color: LEDGER.ink }}
              value={query}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr
                  className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                  style={{ color: LEDGER.muted, borderBottom: `1px solid ${LEDGER.line}` }}
                >
                  <th className="px-5 py-3">Account</th>
                  <th className="px-5 py-3">Terms</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                  <th className="px-5 py-3 text-right">Lifetime</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ customer, stats }, index) => {
                  const active = customer.id === selectedId;
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedId(customer.id)}
                      className="cursor-pointer transition"
                      style={{
                        borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}`,
                        backgroundColor: active ? LEDGER.indigoSoft : "transparent"
                      }}
                    >
                      <td className="px-5 py-3.5">
                        <p
                          className="text-[13px] font-semibold"
                          style={{ color: active ? LEDGER.indigo : LEDGER.ink }}
                        >
                          {customer.company}
                        </p>
                        <p className="text-[12px]" style={{ color: LEDGER.body }}>
                          {customer.name}
                        </p>
                      </td>
                      <td
                        className="px-5 py-3.5 text-[12px] font-medium"
                        style={{ color: LEDGER.body }}
                      >
                        {customer.terms}
                      </td>
                      <td
                        className="px-5 py-3.5 text-right text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {stats.orderCount}
                      </td>
                      <td
                        className="px-5 py-3.5 text-right text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd0(stats.lifetimeValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 ? (
            <AdminEmpty
              icon={<Users className="h-9 w-9" />}
              title="No customers found"
              description="Adjust the search to find an account."
            />
          ) : null}
        </AdminCard>

        {/* Detail panel */}
        {selected ? (
          <div className="grid content-start gap-4">
            <AdminCard className="p-5">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Account
              </span>
              <h2
                className="mt-1 text-lg font-semibold tracking-tight"
                style={{ color: LEDGER.ink }}
              >
                {selected.customer.company}
              </h2>
              <p className="text-[13px]" style={{ color: LEDGER.body }}>
                {selected.customer.name}
              </p>

              <div className="mt-4 grid gap-2.5 text-[13px]">
                <p className="flex items-center gap-2" style={{ color: LEDGER.body }}>
                  <Mail className="h-4 w-4" style={{ color: LEDGER.muted }} />
                  {selected.customer.email}
                </p>
                <p className="flex items-center gap-2" style={{ color: LEDGER.body }}>
                  <Phone className="h-4 w-4" style={{ color: LEDGER.muted }} />
                  {selected.customer.phone}
                </p>
                <p className="flex items-center gap-2" style={{ color: LEDGER.body }}>
                  <Building2 className="h-4 w-4" style={{ color: LEDGER.muted }} />
                  Terms: {selected.customer.terms}
                </p>
              </div>

              <div
                className="mt-4 grid grid-cols-2 gap-3 rounded-xl p-3"
                style={{ backgroundColor: LEDGER.canvas }}
              >
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: LEDGER.muted }}
                  >
                    Lifetime value
                  </p>
                  <p
                    className="mt-0.5 text-base font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    {formatUsd0(selected.stats.lifetimeValue)}
                  </p>
                </div>
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: LEDGER.muted }}
                  >
                    Open balance
                  </p>
                  <p
                    className="mt-0.5 text-base font-semibold"
                    style={{
                      color: selected.stats.openValue > 0 ? LEDGER.amber : LEDGER.mint
                    }}
                  >
                    {formatUsd0(selected.stats.openValue)}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard className="p-5">
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Addresses
              </span>
              <div className="mt-3 grid gap-3 text-[13px]">
                <div>
                  <p
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: LEDGER.muted }}
                  >
                    <MapPin className="h-3.5 w-3.5" /> Billing
                  </p>
                  <p
                    className="mt-1 whitespace-pre-line"
                    style={{ color: LEDGER.body }}
                  >
                    {selected.customer.billingAddress}
                  </p>
                </div>
                <div>
                  <p
                    className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    style={{ color: LEDGER.muted }}
                  >
                    <MapPin className="h-3.5 w-3.5" /> Jobsite
                  </p>
                  <p
                    className="mt-1 whitespace-pre-line"
                    style={{ color: LEDGER.body }}
                  >
                    {selected.customer.jobsiteAddress}
                  </p>
                </div>
              </div>
            </AdminCard>

            <AdminCard>
              <div
                className="flex items-center justify-between gap-2 p-4"
                style={{ borderBottom: `1px solid ${LEDGER.line}` }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: LEDGER.muted }}
                >
                  Recent orders
                </span>
                <span className="flex items-center gap-1 text-[12px]" style={{ color: LEDGER.muted }}>
                  <CalendarClock className="h-3.5 w-3.5" />
                  {selected.stats.lastOrderAt
                    ? formatAdminDate(selected.stats.lastOrderAt)
                    : "No orders"}
                </span>
              </div>
              {selected.stats.orders.length ? (
                <ul>
                  {selected.stats.orders.slice(0, 6).map((order, index) => (
                    <li
                      key={order.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                      style={{
                        borderTop: index === 0 ? "none" : `1px solid ${LEDGER.line}`
                      }}
                    >
                      <div className="min-w-0">
                        <p
                          className="text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {order.orderNumber}
                        </p>
                        <p className="text-[12px]" style={{ color: LEDGER.muted }}>
                          {formatAdminDate(order.createdAt)} · {order.fulfillmentMethod}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill tone={orderStatusTone(order.status)}>
                          {titleCase(order.status)}
                        </StatusPill>
                        <span
                          className="text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {formatUsd(order.total)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <AdminEmpty
                  icon={<Receipt className="h-8 w-8" />}
                  title="No orders yet"
                  description="This account has no purchase history in the workspace."
                />
              )}
            </AdminCard>
          </div>
        ) : null}
      </div>
    </div>
  );
}
