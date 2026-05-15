"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
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
    orderCount: 8
  }
];

export function CustomersDashboard() {
  const displayName = useUserStore((state) => state.displayName);
  const userId = useUserStore((state) => state.userId);
  const orders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const savedCarts = useSavedCartStore((state) => state.carts);
  const setCarts = useSavedCartStore((state) => state.setCarts);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [hasLoadedPersistedData, setHasLoadedPersistedData] = useState(false);

  useEffect(() => {
    async function loadCustomerData() {
      const [ordersResponse, cartsResponse] = await Promise.all([
        fetch("/api/orders?limit=250", { cache: "no-store" }),
        fetch(`/api/saved-carts?userId=${encodeURIComponent(userId)}`, {
          cache: "no-store"
        })
      ]);

      if (ordersResponse.ok) {
        const payload = (await ordersResponse.json()) as {
          orders?: typeof orders;
          persisted?: boolean;
        };
        if (payload.persisted && payload.orders) setOrders(payload.orders);
        if (payload.persisted) setHasLoadedPersistedData(true);
      }

      if (cartsResponse.ok) {
        const payload = (await cartsResponse.json()) as {
          carts?: typeof savedCarts;
          persisted?: boolean;
        };
        if (payload.persisted && payload.carts) setCarts(payload.carts);
        if (payload.persisted) setHasLoadedPersistedData(true);
      }
    }

    void loadCustomerData();
  }, [setCarts, setOrders, userId]);

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
      orderCount: orders.length
    }),
    [displayName, orders, userId]
  );

  const accounts = useMemo(
    () =>
      hasLoadedPersistedData
        ? [currentAccount]
        : [currentAccount, ...sampleAccounts],
    [currentAccount, hasLoadedPersistedData]
  );
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

  return (
    <PageShell
      description="Contractor and customer account controls for pricing tiers, net terms, tax status, saved carts, jobsite addresses, account users, and order history."
      eyebrow="Gateworks Operations"
      title="Customers"
    >
      <div className="grid gap-5">
        <StatGrid
          className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-4"
          stats={[
            { label: "Accounts", value: accounts.length },
            { label: "Orders", value: orders.length },
            { label: "Saved carts", value: savedCarts.length },
            { label: "Customer value", value: formatCurrency(currentAccount.orderValue) }
          ]}
        />

        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                Account Directory
              </p>
              <h2 className="text-xl font-black text-industrial-ink">Contractor accounts</h2>
            </div>
            <Users size={20} />
          </CardHeader>
          <CardBody className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
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
              <Button variant="primary">Add account</Button>
            </div>

            <div className="overflow-x-auto border border-industrial-rail">
              <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="bg-industrial-paper text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
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
                  {filteredAccounts.map((account) => (
                    <tr className="border-t border-industrial-rail" key={account.id}>
                      <td className="px-3 py-3">
                        <p className="font-black text-industrial-ink">{account.company}</p>
                        <p className="text-xs text-industrial-steel">{account.name}</p>
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
