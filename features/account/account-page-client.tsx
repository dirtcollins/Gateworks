"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Building2, Clock, FileText, RotateCcw, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import { useCartStore } from "@/lib/cart-store";
import { useOrderStore } from "@/lib/order-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import { useUserStore } from "@/lib/user-store";
import { formatCurrency } from "@/lib/utils";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function AccountPageClient() {
  const displayName = useUserStore((state) => state.displayName);
  const userId = useUserStore((state) => state.userId);
  const orders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const carts = useSavedCartStore((state) => state.carts);
  const setCarts = useSavedCartStore((state) => state.setCarts);
  const deleteCart = useSavedCartStore((state) => state.deleteCart);
  const replaceCart = useCartStore((state) => state.replaceCart);

  const openOrders = orders.filter((order) => !["completed", "cancelled"].includes(order.status));
  const orderValue = orders.reduce((total, order) => total + order.total, 0);

  useEffect(() => {
    async function loadAccountData() {
      const [ordersResponse, cartsResponse] = await Promise.all([
        fetch(`/api/orders?userId=${encodeURIComponent(userId)}&includeItems=false`, {
          cache: "no-store"
        }),
        fetch(`/api/saved-carts?userId=${encodeURIComponent(userId)}`, { cache: "no-store" })
      ]);

      if (ordersResponse.ok) {
        const payload = (await ordersResponse.json()) as {
          orders?: typeof orders;
          persisted?: boolean;
        };
        if (payload.persisted && payload.orders) setOrders(payload.orders);
      }

      if (cartsResponse.ok) {
        const payload = (await cartsResponse.json()) as {
          carts?: typeof carts;
          persisted?: boolean;
        };
        if (payload.persisted && payload.carts) setCarts(payload.carts);
      }
    }

    void loadAccountData();
  }, [setCarts, setOrders, userId]);

  return (
    <PageShell
      description="Customer account center for contractor order history, saved carts, repeat ordering, quote requests, invoices, jobsites, and terms readiness."
      eyebrow="Gateworks Customer"
      title="Account"
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                Current Account
              </p>
              <h2 className="text-2xl font-black text-industrial-ink">{displayName}</h2>
              <p className="mt-1 text-sm text-industrial-steel">Account key: {userId}</p>
            </div>
            <Building2 size={24} />
          </CardHeader>
        </Card>

        <StatGrid
          className="grid-cols-2 overflow-hidden bg-white lg:grid-cols-4"
          stats={[
            { label: "Orders", value: orders.length },
            { label: "Open", value: openOrders.length },
            { label: "Saved carts", value: carts.length },
            { label: "Order value", value: formatCurrency(orderValue) }
          ]}
        />

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <Card>
            <CardHeader>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                  Order History
                </p>
                <h2 className="text-xl font-black text-industrial-ink">Recent orders and quote requests</h2>
              </div>
              <Clock size={20} />
            </CardHeader>
            <CardBody className="grid gap-3">
              {orders.length ? (
                orders.map((order) => (
                  <div className="grid gap-3 border border-industrial-rail p-3 lg:grid-cols-[1fr_auto]" key={order.id}>
                    <div>
                      <p className="font-black text-industrial-ink">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-industrial-steel">
                        {order.jobName || order.companyName || order.customerName} / {formatDate(order.createdAt)}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-industrial-muted">
                        {order.status} / {order.fulfillmentMethod} / {order.requestedWindow}
                      </p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-xl font-black text-industrial-ink">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-industrial-steel">{order.items.length} SKUs</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid place-items-center border border-dashed border-industrial-rail p-10 text-center">
                  <FileText size={28} />
                  <p className="mt-3 text-sm font-semibold text-industrial-steel">
                    No orders yet. Submit a checkout or quote request to build account history.
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          <aside className="grid content-start gap-5">
            <Card>
              <CardHeader>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                    Repeat Ordering
                  </p>
                  <h2 className="text-xl font-black text-industrial-ink">Saved carts</h2>
                </div>
                <ShoppingCart size={20} />
              </CardHeader>
              <CardBody className="grid gap-3">
                {carts.length ? (
                  carts.map((cart) => (
                    <div className="border border-industrial-rail p-3" key={cart.id}>
                      <p className="font-black text-industrial-ink">{cart.name}</p>
                      <p className="mt-1 text-xs font-semibold text-industrial-muted">
                        {cart.items.length} SKUs {cart.jobName ? `/ ${cart.jobName}` : ""}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Link href="/cart" className="flex-1">
                          <Button className="w-full" onClick={() => replaceCart(cart.items)} size="sm" variant="primary">
                            <RotateCcw size={15} />
                            Reorder
                          </Button>
                        </Link>
                        <Button
                          onClick={() => {
                            deleteCart(cart.id);
                            void fetch(`/api/saved-carts?cartId=${encodeURIComponent(cart.id)}`, {
                              method: "DELETE"
                            }).catch(() => null);
                          }}
                          size="sm"
                          variant="danger"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="border border-industrial-rail p-3 text-sm leading-6 text-industrial-steel">
                    Save a cart from the cart page to enable repeat ordering for common jobs.
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-xl font-black text-industrial-ink">Contractor terms</h2>
              </CardHeader>
              <CardBody className="grid gap-3 text-sm leading-6 text-industrial-steel">
                <p>Contractor pricing, saved jobsites, tax exempt status, approvals, and net terms are structured for the next Supabase-backed account tables.</p>
                <Link href="/checkout">
                  <Button className="w-full">Start checkout</Button>
                </Link>
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
