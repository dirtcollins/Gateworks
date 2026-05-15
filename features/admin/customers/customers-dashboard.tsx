"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  CalendarDays,
  FileText,
  Globe,
  Mail,
  Phone,
  MapPin,
  Search,
  ShieldCheck,
  StickyNote,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { useOrderStore } from "@/lib/order-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import { useUserStore } from "@/lib/user-store";
import { formatCurrency } from "@/lib/utils";

type ContractorAccount = {
  id: string;
  name: string;
  company: string;
  type: "retail" | "contractor";
  netTerms: string;
  pricingTier: string;
  taxExempt: boolean;
  users: number;
  jobsites: number;
  orderValue: number;
  orderCount: number;
  email: string;
  phone: string;
  notes: string;
  defaultAddress: string;
};

type PurchaseHistoryRow = {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  fulfillmentMethod: string;
  date: string;
  paymentStatus: string;
};

type QuoteRow = {
  id: string;
  title: string;
  createdAt: string;
  total: number;
  status: string;
};

type InvoiceRow = {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  dueDate: string;
};

type CustomerAddress = {
  label: string;
  line1: string;
  cityStateZip: string;
  phone: string;
};

const sampleAccounts: ContractorAccount[] = [
  {
    id: "jessie-metal",
    name: "Jessie Metal Supply",
    company: "Jessie Metal Supply",
    type: "contractor",
    netTerms: "Net 30",
    pricingTier: "Contractor",
    taxExempt: false,
    users: 3,
    jobsites: 4,
    orderValue: 12840,
    orderCount: 8,
    email: "orders@jessiemetal.example",
    phone: "(323) 555-1001",
    notes: "Longstanding contractor account with regular gate projects and weekly deliveries.",
    defaultAddress: "1200 Industrial Way, Los Angeles, CA 90001"
  }
];

const placeholderSavedQuotes: QuoteRow[] = [
  {
    id: "quote-jessie-2026-0510",
    title: "Fence gate set with leaf latches",
    createdAt: "2026-05-10",
    total: 2180,
    status: "Draft"
  },
  {
    id: "quote-jessie-2026-0512",
    title: "Decorative gate hardware lot",
    createdAt: "2026-05-12",
    total: 760,
    status: "Sent"
  }
];

const placeholderInvoices: InvoiceRow[] = [
  {
    id: "inv-0011",
    invoiceNumber: "INV-2026-0011",
    amount: 1450,
    status: "Open",
    dueDate: "2026-06-02"
  },
  {
    id: "inv-0012",
    invoiceNumber: "INV-2026-0012",
    amount: 930,
    status: "Open",
    dueDate: "2026-06-09"
  }
];

const kpiCards = [
  { label: "Active accounts", valueKey: "accounts" },
  { label: "Open orders", valueKey: "orders" },
  { label: "Saved carts", valueKey: "savedCarts" },
  { label: "Customers with activity", valueKey: "activeAccounts" }
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function CustomersDashboard() {
  const displayName = useUserStore((state) => state.displayName);
  const userId = useUserStore((state) => state.userId);
  const orders = useOrderStore((state) => state.orders);
  const savedCarts = useSavedCartStore((state) => state.carts);
  const setCarts = useSavedCartStore((state) => state.setCarts);

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [hasLoadedPersistedData, setHasLoadedPersistedData] = useState(false);
  const [localAccounts, setLocalAccounts] = useState<ContractorAccount[]>([]);
  const [actionNotice, setActionNotice] = useState("");

  useEffect(() => {
    async function loadPersistedCarts() {
      const response = await fetch(
        `/api/saved-carts?userId=${encodeURIComponent(userId || "guest")}`,
        { cache: "no-store" }
      );

      if (!response.ok) return;

      const payload = (await response.json()) as {
        carts?: typeof savedCarts;
        persisted?: boolean;
      };

      if (payload.persisted && payload.carts) setCarts(payload.carts);
      setHasLoadedPersistedData(Boolean(payload.persisted));
    }

    void loadPersistedCarts();
  }, [setCarts, userId]);

  const activeAccountsFromOrders = useMemo(() => {
    const rows = new Map<string, ContractorAccount>();

    for (const order of orders) {
      const key = `${order.companyName || order.customerName}-${order.email}`;
      const existing = rows.get(key);
      const addressLabel = [
        order.jobsiteAddress.addressLine1,
        order.jobsiteAddress.city,
        order.jobsiteAddress.state,
        order.jobsiteAddress.postalCode
      ]
        .filter(Boolean)
        .join(", ");

      if (!existing) {
        rows.set(key, {
          id: order.userId || order.id,
          name: order.customerName,
          company: order.companyName,
          type: "contractor",
          netTerms: "Standard",
          pricingTier: "Operational",
          taxExempt: false,
          users: 1,
          jobsites: 1,
          orderValue: order.total,
          orderCount: 1,
          email: order.email,
          phone: order.phone,
          notes: `Customer account is derived from active order history.`,
          defaultAddress: addressLabel
        });
      } else {
        rows.set(key, {
          ...existing,
          orderValue: existing.orderValue + order.total,
          orderCount: existing.orderCount + 1,
          jobsites: Math.max(existing.jobsites, 1)
        });
      }
    }

    return Array.from(rows.values()).sort((left, right) =>
      left.company.localeCompare(right.company)
    );
  }, [orders]);

  const currentAccount: ContractorAccount = useMemo(
    () => ({
      id: userId,
      name: displayName,
      company: displayName === "Guest" ? "Guest checkout" : displayName,
      type: "contractor",
      netTerms: "Application needed",
      pricingTier: "Standard",
      taxExempt: false,
      users: 1,
      jobsites: orders.filter((order) => order.jobsiteAddress.addressLine1).length,
      orderValue: orders.reduce((total, order) => total + order.total, 0),
      orderCount: orders.length,
      email: "operations@guest.example",
      phone: "(323) 555-0000",
      notes: "Current admin-session account for local workspace operations.",
      defaultAddress: "Checkout location pending"
    }),
    [displayName, orders, userId]
  );

  const accounts = useMemo(() => {
    const source = hasLoadedPersistedData
      ? [currentAccount, ...localAccounts, ...activeAccountsFromOrders]
      : [currentAccount, ...localAccounts, ...activeAccountsFromOrders, ...sampleAccounts];

    const dedupe = new Map<string, ContractorAccount>();
    for (const account of source) {
      dedupe.set(`${account.id}-${account.company}`, account);
    }

    return Array.from(dedupe.values())
      .sort((left, right) => left.company.localeCompare(right.company));
  }, [activeAccountsFromOrders, currentAccount, hasLoadedPersistedData, localAccounts]);

  const addAccount = () => {
    const nextAccount = localAccounts.length + 1;
    const newAccount: ContractorAccount = {
      id: `manual-account-${Date.now()}`,
      name: `New Customer ${nextAccount}`,
      company: `New Customer ${nextAccount}`,
      type: "contractor",
      netTerms: "Net 30",
      pricingTier: "Standard",
      taxExempt: false,
      users: 1,
      jobsites: 0,
      orderValue: 0,
      orderCount: 0,
      email: `new-customer-${nextAccount}@example.org`,
      phone: "(323) 555-0100",
      notes: "Placeholder account. Connect the customer service to persist this record.",
      defaultAddress: "Customer address pending"
    };

    setLocalAccounts((previousAccounts) => [newAccount, ...previousAccounts]);
    setSelectedCustomerId(newAccount.id);
    setType("all");
    setQuery("");
    setActionNotice("Added local placeholder account. Backend creation is not connected yet.");
    setTimeout(() => {
      setActionNotice("");
    }, 2500);
  };

  const filteredAccounts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return accounts.filter((account) => {
      const matchesSearch =
        !normalized ||
        account.name.toLowerCase().includes(normalized) ||
        account.company.toLowerCase().includes(normalized);
      const matchesType = type === "all" || account.type === type;
      return matchesSearch && matchesType;
    });
  }, [accounts, query, type]);

  useEffect(() => {
    if (!filteredAccounts.length) {
      setSelectedCustomerId("");
      return;
    }

    if (!selectedCustomerId || !filteredAccounts.find((item) => item.id === selectedCustomerId)) {
      setSelectedCustomerId(filteredAccounts[0].id);
    }
  }, [filteredAccounts, selectedCustomerId]);

  const selectedCustomer = useMemo(() => {
    return filteredAccounts.find((account) => account.id === selectedCustomerId) || filteredAccounts[0];
  }, [filteredAccounts, selectedCustomerId]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => order.email === selectedCustomer?.email || order.companyName === selectedCustomer?.company),
    [orders, selectedCustomer?.company, selectedCustomer?.email]
  );

  const deliveryAddresses = useMemo<CustomerAddress[]>(() => {
    if (!selectedCustomer) return [];

    const addresses = new Map<string, CustomerAddress>();

    for (const order of selectedOrders) {
      const key = `${order.jobsiteAddress.addressLine1}|${order.jobsiteAddress.city}`;
      addresses.set(key, {
        label: order.jobsiteAddress.name || order.customerName,
        line1: order.jobsiteAddress.addressLine1 || "No street address",
        cityStateZip: `${order.jobsiteAddress.city || "—"} ${order.jobsiteAddress.state || ""} ${order.jobsiteAddress.postalCode || ""}`.trim(),
        phone: order.phone
      });
    }

    if (!addresses.size && selectedCustomer.defaultAddress) {
      addresses.set("fallback", {
        label: selectedCustomer.company,
        line1: selectedCustomer.defaultAddress,
        cityStateZip: "",
        phone: selectedCustomer.phone
      });
    }

    return Array.from(addresses.values());
  }, [selectedCustomer, selectedOrders]);

  const purchaseHistory = useMemo<PurchaseHistoryRow[]>(() => {
    return selectedOrders
      .slice()
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      .slice(0, 6)
      .map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        fulfillmentMethod: order.fulfillmentMethod,
        date: order.createdAt,
        paymentStatus: order.paymentStatus
      }));
  }, [selectedOrders]);

  const savedQuotes = useMemo(() => {
    if (!hasLoadedPersistedData) return placeholderSavedQuotes;

    return savedCarts.slice(0, 4).map((cart) => ({
      id: cart.id,
      title: cart.name || cart.jobName,
      createdAt: cart.createdAt,
      total: cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: "Draft"
    }));
  }, [hasLoadedPersistedData, savedCarts]);

  const invoices = useMemo(() => {
    if (!hasLoadedPersistedData) return placeholderInvoices;
    return placeholderInvoices;
  }, [hasLoadedPersistedData]);

  const kpiValues = useMemo(
    () => ({
      accounts: accounts.length,
      orders: orders.length,
      savedCarts: savedCarts.length,
      activeAccounts: activeAccountsFromOrders.length
    }),
    [accounts.length, orders.length, savedCarts.length, activeAccountsFromOrders.length]
  );

  return (
    <PageShell
      title="Customers"
      description="Customer relationship workspace for account history, orders, quotes, delivery locations, and notes."
      eyebrow="Gateworks Operations"
    >
      <div className="grid gap-3 xl:grid-cols-[1fr_380px]">
        <div className="grid gap-5">
          <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card) => (
              <Card className="rounded-2xl p-3" key={card.label}>
                <p className="text-[11px] font-black uppercase tracking-[0.13em] leading-tight text-industrial-muted">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-industrial-ink">
                  {kpiValues[card.valueKey as keyof typeof kpiValues]}
                </p>
              </Card>
            ))}
          </section>

          <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="px-4 py-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Customer management
                </p>
                <h2 className="text-lg font-black text-industrial-ink">Account directory</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  className="h-9 normal-case tracking-normal"
                  size="sm"
                  variant="primary"
                  type="button"
                  onClick={addAccount}
                >
                  <Users size={14} />
                  Add account
                </Button>
              </div>
            </CardHeader>

            <CardBody className="grid gap-4">
              {actionNotice ? (
                <p className="text-xs text-industrial-muted">{actionNotice}</p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-industrial-muted" size={16} />
                  <Input
                    className="pl-9"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search customer or company"
                    value={query}
                  />
                </label>

                <Select onChange={(event) => setType(event.target.value)} value={type}>
                  <option value="all">All account types</option>
                  <option value="retail">Retail</option>
                  <option value="contractor">Contractor</option>
                </Select>

                <Select onChange={() => undefined} value="all" aria-label="Relationship scope">
                  <option value="all">Relationship scope</option>
                </Select>
              </div>

              <div className="overflow-x-auto border border-industrial-rail">
                <table className="min-w-[980px] w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-industrial-paper text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                    <tr>
                      <th className="px-3 py-3">Company</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Pricing</th>
                      <th className="px-3 py-3">Terms</th>
                      <th className="px-3 py-3">Users</th>
                      <th className="px-3 py-3">Jobsites</th>
                      <th className="px-3 py-3">Orders</th>
                      <th className="px-3 py-3">Value</th>
                      <th className="px-3 py-3">Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => {
                      const isSelected = selectedCustomerId === account.id;

                      return (
                        <tr
                          className={`border-t border-industrial-rail transition hover:bg-industrial-paper ${
                            isSelected ? "bg-amber-50/70" : "bg-white"
                          }`}
                          key={account.id}
                        >
                          <td className="px-3 py-3">
                            <button
                              className="w-full text-left"
                              onClick={() => setSelectedCustomerId(account.id)}
                              type="button"
                            >
                              <p className="font-black text-industrial-ink">{account.company}</p>
                              <p className="text-xs text-industrial-steel">{account.name}</p>
                            </button>
                          </td>
                          <td className="px-3 py-3 capitalize">{account.type}</td>
                          <td className="px-3 py-3">{account.pricingTier}</td>
                          <td className="px-3 py-3">{account.netTerms}</td>
                          <td className="px-3 py-3">{account.users}</td>
                          <td className="px-3 py-3">{account.jobsites}</td>
                          <td className="px-3 py-3">{account.orderCount}</td>
                          <td className="px-3 py-3 font-black">{formatCurrency(account.orderValue)}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm">
                                <Building2 size={15} />
                                Jobsites
                              </Button>
                              <Button size="sm">
                                <ShieldCheck size={15} />
                                Permissions
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {!filteredAccounts.length ? (
                      <tr>
                        <td className="px-3 py-8 text-sm text-industrial-muted" colSpan={9}>
                          No customers found for this search.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        </div>

        <aside className="grid content-start gap-4">
          <Card className="rounded-2xl">
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Customer workspace
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Contact details</h2>
              </div>
            </CardHeader>
            <CardBody className="grid gap-3 text-sm">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-industrial-muted">Customer</p>
                <p className="text-lg font-black text-industrial-ink">{selectedCustomer?.company || "No customer selected"}</p>
              </div>
              <p className="flex items-center gap-2 text-industrial-steel">
                <span className="text-industrial-muted"><Mail size={14} aria-hidden="true" /></span>
                {selectedCustomer?.email || "—"}
              </p>
              <p className="flex items-center gap-2 text-industrial-steel">
                <span className="text-industrial-muted"><Phone size={14} aria-hidden="true" /></span>
                {selectedCustomer?.phone || "—"}
              </p>
              <p className="flex items-center gap-2 text-industrial-steel">
                <span className="text-industrial-muted"><Users size={14} aria-hidden="true" /></span>
                Terms: {selectedCustomer?.netTerms || "—"} · {selectedCustomer?.pricingTier || "—"}
              </p>
            </CardBody>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Purchase history
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Recent orders</h2>
              </div>
              <CalendarDays size={18} className="text-industrial-muted" />
            </CardHeader>
            <CardBody className="grid gap-2">
              {purchaseHistory.length ? (
                purchaseHistory.map((entry) => (
                  <div className="grid gap-1 border border-industrial-rail p-3" key={entry.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-black text-industrial-ink">{entry.orderNumber}</p>
                      <span className="text-[11px] font-black uppercase tracking-[0.08em] text-industrial-muted">
                        {entry.fulfillmentMethod}
                      </span>
                    </div>
                    <p className="text-sm text-industrial-steel">
                      {formatCurrency(entry.total)} · {entry.status} · {formatDate(entry.date)}
                    </p>
                    <p className="text-xs text-industrial-muted">Payment: {entry.paymentStatus}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-industrial-rail p-3 text-sm text-industrial-muted">
                  No purchase history available for this customer in workspace data.
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Saved quotes
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Draft / Sent quotes</h2>
              </div>
              <FileText size={18} className="text-industrial-muted" />
            </CardHeader>
            <CardBody className="grid gap-2 text-sm">
              {savedQuotes.length ? (
                savedQuotes.map((quote) => (
                  <div className="flex items-center justify-between gap-2 border border-industrial-rail p-3" key={quote.id}>
                    <div>
                      <p className="font-black text-industrial-ink">{quote.title}</p>
                      <p className="text-xs text-industrial-muted">{formatDate(quote.createdAt)} · {quote.status}</p>
                    </div>
                    <p className="font-black text-industrial-ink">{formatCurrency(quote.total)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-industrial-rail p-3 text-sm text-industrial-muted">
                  No saved quote records loaded yet.
                </p>
              )}
              <Button className="h-9 w-full normal-case tracking-normal" size="sm" variant="secondary" type="button">
                <FileText size={14} />
                Convert to order placeholder
              </Button>
            </CardBody>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Open invoices
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Receivables</h2>
              </div>
              <Globe size={18} className="text-industrial-muted" />
            </CardHeader>
            <CardBody className="grid gap-2">
              {invoices.length ? (
                invoices.map((invoice) => (
                  <div className="flex items-center justify-between border border-industrial-rail p-3" key={invoice.id}>
                    <div>
                      <p className="font-black text-industrial-ink">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-industrial-muted">
                        {invoice.status} · due {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <p className="font-black text-industrial-ink">{formatCurrency(invoice.amount)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-industrial-rail p-3 text-sm text-industrial-muted">
                  Open invoice data source is not connected in this environment.
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Delivery addresses
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Customer delivery list</h2>
              </div>
              <MapPin size={18} className="text-industrial-muted" />
            </CardHeader>
            <CardBody className="grid gap-2">
              {deliveryAddresses.length ? (
                deliveryAddresses.slice(0, 4).map((address, index) => (
                    <div className="grid gap-1 border border-industrial-rail p-3" key={`${address.label}-${index}`}>
                    <p className="font-black text-industrial-ink">{address.label}</p>
                    <p className="text-sm text-industrial-steel">{address.line1}</p>
                    <p className="text-xs text-industrial-muted">{address.cityStateZip}</p>
                    <p className="text-xs text-industrial-steel">{address.phone}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-dashed border-industrial-rail p-3 text-sm text-industrial-muted">
                  No delivery addresses available yet.
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Internal notes
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Staff notes</h2>
              </div>
              <StickyNote size={18} className="text-industrial-muted" />
            </CardHeader>
            <CardBody className="grid gap-2 text-sm text-industrial-steel">
              <p>
                {selectedCustomer?.notes || "No notes recorded yet. Use connected CRM notes service to persist internal comments."}
              </p>
              <p className="rounded-md border border-dashed border-industrial-rail p-3 text-xs text-industrial-muted">
                Internal notes persistence is a placeholder until staff-ops notes service is connected.
              </p>
            </CardBody>
          </Card>
        </aside>
      </div>
    </PageShell>
  );
}
