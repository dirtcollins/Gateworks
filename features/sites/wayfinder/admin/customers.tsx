// Wayfinder admin — customer directory. Blends the real `lib/customers`
// registry with accounts derived from the live order store (lib/order-store,
// bootstrapped from /api/orders) AND the people who actually registered site
// accounts (GET /api/site-users). Selecting a row opens a detail rail with
// contact info, terms, purchase history and jobsite/delivery addresses.
"use client";

import { useEffect, useMemo, useState } from "react";
import { customerDirectory } from "@/lib/customers";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { fmt } from "../kit";
import {
  DataTable,
  Ico,
  Kpi,
  Mono,
  Panel,
  PageHead,
  Pill,
  TextInput,
  monoFont,
  wf,
  type Column
} from "./admin-kit";
import { formatDate, ORDER_STATUS_LABELS, orderStatusTone } from "./order-helpers";
import { fetchSiteUsers, type SiteUser } from "./site-users";

type Account = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  terms: string;
  billingAddress: string;
  source: "registry" | "orders" | "registered";
  orderCount: number;
  orderValue: number;
  lastOrderAt: string;
};

// Normalize a contact key so registry + order-derived accounts dedupe cleanly.
function accountKey(email: string, company: string) {
  return `${email.trim().toLowerCase()}|${company.trim().toLowerCase()}`;
}

export function WayfinderCustomers() {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<SiteUser[]>([]);

  useEffect(() => {
    useOrderStore.persist.rehydrate();
    async function load() {
      try {
        const [ordersRes, usersResult] = await Promise.all([
          fetch("/api/orders?limit=250&includeItems=true", {
            cache: "no-store"
          }),
          fetchSiteUsers()
        ]);
        if (ordersRes.ok) {
          const payload = (await ordersRes.json()) as {
            orders?: OrderRecord[];
            persisted?: boolean;
          };
          if (payload.persisted && payload.orders) setOrders(payload.orders);
        }
        setRegisteredUsers(usersResult.users);
      } finally {
        setLoaded(true);
      }
    }
    void load();
  }, [setOrders]);

  const orders = useMemo(
    () => storedOrders.filter((order) => !order.isQuoteRequest),
    [storedOrders]
  );

  // Build the directory: every registry customer, every registered site
  // account, plus any account that only shows up in the order history. Order
  // stats are merged onto matching rows.
  const accounts = useMemo<Account[]>(() => {
    const byKey = new Map<string, Account>();
    // Order stats are also indexed by site-user id so registered accounts
    // (which have no email/company key) still pick up purchase history.
    const statsByUserId = new Map<
      string,
      { orderCount: number; orderValue: number; lastOrderAt: string }
    >();
    for (const order of orders) {
      if (!order.userId || order.userId === "guest") continue;
      const stat = statsByUserId.get(order.userId) || {
        orderCount: 0,
        orderValue: 0,
        lastOrderAt: ""
      };
      stat.orderCount += 1;
      stat.orderValue += order.total;
      if (
        !stat.lastOrderAt ||
        new Date(order.createdAt) > new Date(stat.lastOrderAt)
      ) {
        stat.lastOrderAt = order.createdAt;
      }
      statsByUserId.set(order.userId, stat);
    }

    for (const customer of customerDirectory) {
      byKey.set(accountKey(customer.email, customer.company), {
        id: customer.id,
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        terms: customer.terms,
        billingAddress: customer.billingAddress,
        source: "registry",
        orderCount: 0,
        orderValue: 0,
        lastOrderAt: ""
      });
    }

    // Registered site accounts — real people who signed up. Keyed by their
    // user id so order history (matched on userId) merges in.
    for (const user of registeredUsers) {
      const stat = statsByUserId.get(user.id);
      byKey.set(`registered:${user.id}`, {
        id: `registered:${user.id}`,
        name: user.displayName,
        company: user.displayName,
        email: "",
        phone: "",
        terms: "Due on receipt",
        billingAddress: "",
        source: "registered",
        orderCount: stat?.orderCount ?? 0,
        orderValue: stat?.orderValue ?? 0,
        lastOrderAt: stat?.lastOrderAt ?? ""
      });
    }

    const registeredIds = new Set(registeredUsers.map((user) => user.id));

    for (const order of orders) {
      // Orders belonging to a registered account are already represented by
      // that account row — skip them here to avoid a duplicate "From orders".
      if (order.userId && registeredIds.has(order.userId)) continue;

      const company = order.companyName || order.customerName || "Unknown";
      const key = accountKey(order.email, company);
      const existing = byKey.get(key);
      if (existing) {
        existing.orderCount += 1;
        existing.orderValue += order.total;
        if (
          !existing.lastOrderAt ||
          new Date(order.createdAt) > new Date(existing.lastOrderAt)
        ) {
          existing.lastOrderAt = order.createdAt;
        }
        continue;
      }
      byKey.set(key, {
        id: order.userId || order.id,
        name: order.customerName || company,
        company,
        email: order.email,
        phone: order.phone,
        terms: "Due on receipt",
        billingAddress: [
          order.jobsiteAddress.addressLine1,
          [
            order.jobsiteAddress.city,
            order.jobsiteAddress.state,
            order.jobsiteAddress.postalCode
          ]
            .filter(Boolean)
            .join(" ")
        ]
          .filter(Boolean)
          .join("\n"),
        source: "orders",
        orderCount: 1,
        orderValue: order.total,
        lastOrderAt: order.createdAt
      });
    }

    // A registry customer and an order/registered account can share an id;
    // collapse to one row per id so table keys stay unique.
    const byId = new Map(
      Array.from(byKey.values()).map((account) => [account.id, account] as const)
    );
    return Array.from(byId.values()).sort((a, b) =>
      a.company.localeCompare(b.company)
    );
  }, [orders, registeredUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (account) =>
        account.company.toLowerCase().includes(q) ||
        account.name.toLowerCase().includes(q) ||
        account.email.toLowerCase().includes(q)
    );
  }, [accounts, query]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId("");
      return;
    }
    if (!selectedId || !filtered.some((account) => account.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = useMemo(
    () => filtered.find((account) => account.id === selectedId) || filtered[0],
    [filtered, selectedId]
  );

  const selectedOrders = useMemo(() => {
    if (!selected) return [];
    // Registered accounts carry a `registered:<userId>` id — match those
    // orders on userId; registry / order accounts match on email or company.
    const registeredUserId =
      selected.source === "registered"
        ? selected.id.replace(/^registered:/, "")
        : "";
    return orders
      .filter((order) => {
        if (registeredUserId) return order.userId === registeredUserId;
        return (
          (selected.email && order.email === selected.email) ||
          (order.companyName || order.customerName) === selected.company
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [orders, selected]);

  // Distinct jobsite/delivery addresses pulled from the customer's orders.
  const deliveryAddresses = useMemo(() => {
    const seen = new Map<
      string,
      { label: string; line1: string; cityStateZip: string }
    >();
    for (const order of selectedOrders) {
      const address = order.jobsiteAddress;
      const key = `${address.addressLine1}|${address.city}`;
      if (!address.addressLine1) continue;
      seen.set(key, {
        label: address.name || order.jobName || "Jobsite",
        line1: address.addressLine1,
        cityStateZip: [address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(" ")
      });
    }
    return Array.from(seen.values());
  }, [selectedOrders]);

  const totalValue = useMemo(
    () => accounts.reduce((sum, account) => sum + account.orderValue, 0),
    [accounts]
  );
  const activeAccounts = useMemo(
    () => accounts.filter((account) => account.orderCount > 0).length,
    [accounts]
  );
  const registeredCount = registeredUsers.length;

  const columns: Column<Account>[] = [
    {
      key: "company",
      header: "Account",
      render: (account) => (
        <button
          type="button"
          onClick={() => setSelectedId(account.id)}
          style={{
            display: "grid",
            gap: 2,
            background: "none",
            border: "none",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
            width: "100%"
          }}
        >
          <span style={{ fontWeight: 800, color: wf.ink }}>
            {account.company}
          </span>
          <span style={{ fontSize: 11, color: wf.muted }}>{account.name}</span>
        </button>
      )
    },
    {
      key: "contact",
      header: "Contact",
      render: (account) => (
        <div style={{ display: "grid", gap: 2 }}>
          <span style={{ fontSize: 12, color: wf.steel }}>{account.email}</span>
          <span
            style={{ fontFamily: monoFont, fontSize: 11, color: wf.muted }}
          >
            {account.phone}
          </span>
        </div>
      )
    },
    {
      key: "terms",
      header: "Terms",
      render: (account) => (
        <span style={{ fontSize: 12, color: wf.steel }}>{account.terms}</span>
      )
    },
    {
      key: "source",
      header: "Source",
      render: (account) => (
        <Pill
          tone={
            account.source === "registry"
              ? "neutral"
              : account.source === "registered"
                ? "active"
                : "open"
          }
        >
          {account.source === "registry"
            ? "Registry"
            : account.source === "registered"
              ? "Registered"
              : "From orders"}
        </Pill>
      )
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      render: (account) => (
        <Mono style={{ fontWeight: 700 }}>{account.orderCount}</Mono>
      )
    },
    {
      key: "value",
      header: "Lifetime",
      align: "right",
      render: (account) => (
        <Mono style={{ fontWeight: 700 }}>
          {account.orderValue ? fmt(account.orderValue) : "—"}
        </Mono>
      )
    }
  ];

  return (
    <>
      <PageHead
        eyebrow="Floor"
        title="Customers"
        desc="Every account that buys off the floor — the standing customer registry blended with registered site accounts and accounts pulled from live order history."
      />

      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))"
        }}
      >
        <Kpi label="Accounts" value={accounts.length} />
        <Kpi label="Registered" value={registeredCount} tone="pine" />
        <Kpi label="With order history" value={activeAccounts} />
        <Kpi
          label="Lifetime value"
          value={fmt(totalValue, { cents: false })}
          tone="safety"
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "minmax(0, 1fr) 340px",
          alignItems: "start"
        }}
        className="wf-cust-grid"
      >
        <Panel
          title="Account directory"
          meta={
            loaded
              ? `${filtered.length} of ${accounts.length} accounts`
              : "Loading order history…"
          }
          action={
            <div style={{ width: 240, maxWidth: "100%" }}>
              <TextInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search account, contact, email…"
                style={{ height: 34, fontSize: 12 }}
              />
            </div>
          }
          pad={false}
        >
          <DataTable
            columns={columns}
            rows={filtered}
            getKey={(account) => account.id}
            empty={
              loaded
                ? "No accounts match this search."
                : "Loading the customer directory…"
            }
          />
        </Panel>

        <div style={{ display: "grid", gap: 16 }}>
          <Panel title="Account detail" pad>
            {selected ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 900,
                      color: wf.ink
                    }}
                  >
                    {selected.company}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: wf.muted }}>
                    {selected.name}
                  </p>
                </div>
                <DetailRow icon={<Ico.user size={14} />} label="Email">
                  {selected.email}
                </DetailRow>
                <DetailRow icon={<Ico.phone size={14} />} label="Phone">
                  <Mono>{selected.phone}</Mono>
                </DetailRow>
                <DetailRow icon={<Ico.receipt size={14} />} label="Terms">
                  {selected.terms}
                </DetailRow>
                <DetailRow icon={<Ico.pin size={14} />} label="Billing">
                  <span style={{ whiteSpace: "pre-line" }}>
                    {selected.billingAddress || "—"}
                  </span>
                </DetailRow>
                <div
                  style={{
                    display: "flex",
                    gap: 18,
                    paddingTop: 8,
                    borderTop: `1px solid ${wf.hairline}`
                  }}
                >
                  <Stat label="Orders" value={String(selected.orderCount)} />
                  <Stat
                    label="Lifetime"
                    value={
                      selected.orderValue ? fmt(selected.orderValue) : "$0.00"
                    }
                  />
                  <Stat
                    label="Last order"
                    value={
                      selected.lastOrderAt
                        ? formatDate(selected.lastOrderAt)
                        : "—"
                    }
                  />
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: wf.muted }}>
                No account selected.
              </p>
            )}
          </Panel>

          <Panel title="Purchase history" pad={false}>
            {selectedOrders.length ? (
              <div style={{ display: "grid" }}>
                {selectedOrders.slice(0, 8).map((order) => (
                  <div
                    key={order.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "10px 16px",
                      borderBottom: `1px solid ${wf.hairline}`
                    }}
                  >
                    <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                      <Mono style={{ fontWeight: 700, fontSize: 12 }}>
                        {order.orderNumber}
                      </Mono>
                      <span style={{ fontSize: 11, color: wf.muted }}>
                        {formatDate(order.createdAt)} · {order.fulfillmentMethod}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gap: 4,
                        justifyItems: "end"
                      }}
                    >
                      <Mono style={{ fontWeight: 700, fontSize: 12 }}>
                        {fmt(order.total)}
                      </Mono>
                      <Pill tone={orderStatusTone(order.status)}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Pill>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  padding: "20px 16px",
                  fontSize: 12,
                  color: wf.muted,
                  fontFamily: monoFont,
                  textAlign: "center"
                }}
              >
                No orders on record for this account.
              </p>
            )}
          </Panel>

          <Panel title="Delivery addresses" pad={false}>
            {deliveryAddresses.length ? (
              <div style={{ display: "grid" }}>
                {deliveryAddresses.slice(0, 5).map((address, index) => (
                  <div
                    key={`${address.line1}-${index}`}
                    style={{
                      display: "grid",
                      gap: 2,
                      padding: "10px 16px",
                      borderBottom: `1px solid ${wf.hairline}`
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: 12 }}>
                      {address.label}
                    </span>
                    <span style={{ fontSize: 12, color: wf.steel }}>
                      {address.line1}
                    </span>
                    <span
                      style={{
                        fontFamily: monoFont,
                        fontSize: 11,
                        color: wf.muted
                      }}
                    >
                      {address.cityStateZip || "—"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  margin: 0,
                  padding: "20px 16px",
                  fontSize: 12,
                  color: wf.muted,
                  fontFamily: monoFont,
                  textAlign: "center"
                }}
              >
                No delivery addresses recorded.
              </p>
            )}
          </Panel>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .wf-cust-grid { grid-template-columns: minmax(0, 1fr) !important; }
        }
      `}</style>
    </>
  );
}

function DetailRow({
  icon,
  label,
  children
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "grid", gap: 3 }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: wf.steel
        }}
      >
        {icon}
        {label}
      </span>
      <span style={{ fontSize: 13, color: wf.ink }}>{children}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "grid", gap: 2 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: wf.steel
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: monoFont,
          fontSize: 14,
          fontWeight: 700,
          color: wf.ink
        }}
      >
        {value}
      </span>
    </div>
  );
}
