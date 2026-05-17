"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  Users
} from "lucide-react";
import { formatUsd } from "@/features/sites/industrial/kit";
import {
  AdminCard,
  AdminEmptyState,
  AdminHeader,
  AdminPill,
  AdminStatGrid
} from "@/features/sites/industrial/admin/kit";
import { customerDirectory } from "@/lib/customers";
import type { CustomerRecord } from "@/lib/customers";
import { useOrderStore, type OrderRecord } from "@/lib/order-store";
import { sampleAdminOrders } from "@/features/sites/industrial/admin/sample-orders";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin customers. Customer directory list with
 * search + a detail panel. Merges the static directory with accounts
 * derived from the live order store (hydrated from /api/orders).
 * ------------------------------------------------------------------ */

type CustomerAccount = {
  id: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  terms: string;
  billingAddress: string;
  jobsiteAddress: string;
  orderCount: number;
  orderValue: number;
  source: "directory" | "orders" | "registered";
};

type SiteUser = {
  id: string;
  displayName: string;
  lastUsedAt: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function directoryAccounts(): CustomerAccount[] {
  return customerDirectory.map((customer: CustomerRecord) => ({
    id: customer.id,
    company: customer.company,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    terms: customer.terms,
    billingAddress: customer.billingAddress,
    jobsiteAddress: customer.jobsiteAddress,
    orderCount: 0,
    orderValue: 0,
    source: "directory"
  }));
}

export function IndustrialAdminCustomers() {
  const storedOrders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const [siteUsers, setSiteUsers] = useState<SiteUser[]>([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const response = await fetch("/api/orders?limit=250&includeItems=false", {
          cache: "no-store"
        });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          orders?: OrderRecord[];
          persisted?: boolean;
        };
        if (payload.persisted && payload.orders) setOrders(payload.orders);
      } finally {
        setLoaded(true);
      }
    }

    void loadOrders();
  }, [setOrders]);

  // Surface people who actually registered an account via /api/site-users.
  useEffect(() => {
    let active = true;
    fetch("/api/site-users", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { users: [] }))
      .then((payload: { users?: SiteUser[] }) => {
        if (active) setSiteUsers(payload.users || []);
      })
      .catch(() => null);
    return () => {
      active = false;
    };
  }, []);

  const orders = useMemo(() => {
    const real = storedOrders.filter((order) => !order.isQuoteRequest);
    return real.length ? real : sampleAdminOrders;
  }, [storedOrders]);

  const accounts = useMemo(() => {
    const byKey = new Map<string, CustomerAccount>();

    for (const account of directoryAccounts()) {
      byKey.set(account.company.toLowerCase(), account);
    }

    for (const order of orders) {
      const company = order.companyName || order.customerName || "Walk-in";
      const key = company.toLowerCase();
      const existing = byKey.get(key);
      const jobsite = [
        order.jobsiteAddress.addressLine1,
        order.jobsiteAddress.city,
        order.jobsiteAddress.state,
        order.jobsiteAddress.postalCode
      ]
        .filter(Boolean)
        .join(", ");

      if (existing) {
        byKey.set(key, {
          ...existing,
          email: existing.email || order.email,
          phone: existing.phone || order.phone,
          jobsiteAddress:
            existing.source === "orders" && jobsite
              ? jobsite
              : existing.jobsiteAddress,
          orderCount: existing.orderCount + 1,
          orderValue: existing.orderValue + order.total
        });
      } else {
        byKey.set(key, {
          id: order.userId || order.id,
          company,
          name: order.customerName,
          email: order.email,
          phone: order.phone,
          terms: "Standard",
          billingAddress: jobsite || "Address on file pending",
          jobsiteAddress: jobsite || "Add jobsite or delivery address",
          orderCount: 1,
          orderValue: order.total,
          source: "orders"
        });
      }
    }

    // Merge real registered accounts (people who signed up) so the directory
    // reflects who actually has a Gateworks account, not just the static list.
    for (const user of siteUsers) {
      const displayName = user.displayName || "Registered account";
      const key = displayName.toLowerCase();
      if (byKey.has(key)) continue;
      const matchingOrders = orders.filter(
        (order) => order.userId && order.userId === user.id
      );
      const orderValue = matchingOrders.reduce(
        (sum, order) => sum + order.total,
        0
      );
      byKey.set(key, {
        id: user.id,
        company: displayName,
        name: displayName,
        email: matchingOrders[0]?.email || "",
        phone: matchingOrders[0]?.phone || "",
        terms: "Registered",
        billingAddress: "Address on file pending",
        jobsiteAddress: "Add jobsite or delivery address",
        orderCount: matchingOrders.length,
        orderValue,
        source: "registered"
      });
    }

    return Array.from(byKey.values()).sort((a, b) =>
      a.company.localeCompare(b.company)
    );
  }, [orders, siteUsers]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return accounts;
    return accounts.filter(
      (account) =>
        account.company.toLowerCase().includes(term) ||
        account.name.toLowerCase().includes(term) ||
        account.email.toLowerCase().includes(term)
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
    return orders
      .filter(
        (order) =>
          (order.companyName || order.customerName || "Walk-in").toLowerCase() ===
          selected.company.toLowerCase()
      )
      .slice()
      .sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      )
      .slice(0, 6);
  }, [orders, selected]);

  const stats = [
    { label: "Accounts", value: String(accounts.length) },
    {
      label: "Registered accounts",
      value: String(
        accounts.filter((account) => account.source === "registered").length
      )
    },
    {
      label: "With order history",
      value: String(accounts.filter((account) => account.orderCount > 0).length)
    },
    {
      label: "Lifetime value",
      value: formatUsd(accounts.reduce((sum, account) => sum + account.orderValue, 0))
    }
  ];

  return (
    <div className="grid gap-8">
      <AdminHeader
        eyebrow="Network"
        title="Customers"
        description="Account directory with order history, contact details, and delivery locations."
      />

      <AdminStatGrid stats={stats} />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="grid content-start gap-4">
          <div className="flex items-center gap-2 border border-d1-line bg-white px-3">
            <Search className="h-4 w-4 text-d1-steel" />
            <input
              aria-label="Search customers"
              className="h-10 w-full bg-transparent text-sm text-d1-ink outline-none placeholder:text-d1-steel/70"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search company, contact, or email"
              value={query}
            />
          </div>

          {filtered.length ? (
            <section className="overflow-x-auto border border-d1-line bg-d1-card">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b-2 border-d1-ink text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Terms</th>
                    <th className="px-4 py-3 text-right">Orders</th>
                    <th className="px-4 py-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-d1-line">
                  {filtered.map((account) => (
                    <tr
                      className={`cursor-pointer transition hover:bg-d1-paper ${
                        account.id === selectedId ? "bg-d1-paper" : ""
                      }`}
                      key={account.id}
                      onClick={() => setSelectedId(account.id)}
                    >
                      <td className="px-4 py-3.5">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-d1-ink">
                            {account.company}
                          </span>
                          {account.source === "registered" ? (
                            <AdminPill tone="pine">Registered</AdminPill>
                          ) : null}
                        </span>
                        <span className="text-[11px] text-d1-steel">
                          {account.name}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-d1-steel">
                        {account.terms}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-bold text-d1-ink">
                        {account.orderCount}
                      </td>
                      <td className="px-4 py-3.5 text-right text-sm font-extrabold text-d1-ink">
                        {formatUsd(account.orderValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ) : (
            <AdminEmptyState
              icon={<Users className="h-8 w-8" />}
              title={loaded ? "No customers match this search" : "Loading customers…"}
              description={loaded ? "Clear the search to see all accounts." : undefined}
            />
          )}

          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
            Showing {filtered.length} of {accounts.length} accounts
          </p>
        </div>

        <aside className="grid content-start gap-4">
          <AdminCard className="grid gap-3 p-5">
            <div className="flex items-center gap-2 text-d1-steel">
              <Building2 className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                Customer
              </span>
            </div>
            <p className="text-xl font-extrabold text-d1-ink">
              {selected?.company || "No customer selected"}
            </p>
            {selected ? (
              <>
                <p className="text-sm font-semibold text-d1-steel">{selected.name}</p>
                <div className="grid gap-2 text-sm text-d1-steel">
                  <p className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-d1-steel" />
                    {selected.email || "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-d1-steel" />
                    {selected.phone || "—"}
                  </p>
                </div>
                <AdminPill tone="pine">{selected.terms}</AdminPill>
              </>
            ) : null}
          </AdminCard>

          {selected ? (
            <AdminCard className="grid gap-3 p-5">
              <div className="flex items-center gap-2 text-d1-steel">
                <MapPin className="h-4 w-4" />
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                  Addresses
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                  Billing
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-d1-ink">
                  {selected.billingAddress}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-d1-steel">
                  Jobsite / delivery
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-d1-ink">
                  {selected.jobsiteAddress}
                </p>
              </div>
            </AdminCard>
          ) : null}

          <AdminCard className="grid gap-3 p-5">
            <div className="flex items-center gap-2 text-d1-steel">
              <CalendarDays className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-[0.12em]">
                Recent orders
              </span>
            </div>
            {selectedOrders.length ? (
              <div className="grid gap-2">
                {selectedOrders.map((order) => (
                  <div
                    className="grid gap-1 border border-d1-line p-3"
                    key={order.id}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-d1-ink">
                        {order.orderNumber}
                      </span>
                      <span className="text-sm font-extrabold text-d1-ink">
                        {formatUsd(order.total)}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-d1-steel">
                      {dateFormatter.format(new Date(order.createdAt))} ·{" "}
                      {order.fulfillmentMethod} · {order.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="border border-dashed border-d1-line p-3 text-sm text-d1-steel">
                <FileText className="mr-2 inline h-4 w-4" />
                No order history recorded for this account.
              </p>
            )}
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
