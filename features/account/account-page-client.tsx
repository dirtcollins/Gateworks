"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Clock,
  FileText,
  LogIn,
  LogOut,
  RotateCcw,
  ShoppingCart,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page-shell";
import { StatGrid } from "@/components/ui/stat-grid";
import { OrderProgressBar } from "@/components/order-progress";
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

type AuthMode = "login" | "register";

export function AccountPageClient() {
  const displayName = useUserStore((state) => state.displayName);
  const email = useUserStore((state) => state.email);
  const userId = useUserStore((state) => state.userId);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const registerAccount = useUserStore((state) => state.registerAccount);
  const login = useUserStore((state) => state.login);
  const resetUser = useUserStore((state) => state.resetUser);
  const orders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const carts = useSavedCartStore((state) => state.carts);
  const setCarts = useSavedCartStore((state) => state.setCarts);
  const deleteCart = useSavedCartStore((state) => state.deleteCart);
  const replaceCart = useCartStore((state) => state.replaceCart);

  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authDisplayName, setAuthDisplayName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  const openOrders = useMemo(
    () => orders.filter((order) => !["completed", "cancelled"].includes(order.status)),
    [orders]
  );
  const orderValue = useMemo(
    () => orders.reduce((total, order) => total + order.total, 0),
    [orders]
  );
  const canLoadPersistedData = isAuthenticated || userId !== "guest";

  useEffect(() => {
    if (!canLoadPersistedData) return;

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
  }, [canLoadPersistedData, setCarts, setOrders, userId]);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setIsAuthSubmitting(true);

    try {
      if (authMode === "register" && !authDisplayName.trim()) {
        setAuthMessage("Account name is required.");
        return;
      }

      const result =
        authMode === "register"
          ? await registerAccount({
              displayName: authDisplayName,
              email: authEmail,
              password: authPassword
            })
          : await login({
              email: authEmail,
              password: authPassword
            });

      if (!result.ok) {
        setAuthMessage(result.reason || "Authentication failed.");
        return;
      }

      setAuthMessage(authMode === "register" ? "Account created and signed in." : "Welcome back.");
      setAuthDisplayName("");
      setAuthEmail("");
      setAuthPassword("");
    } finally {
      setIsAuthSubmitting(false);
    }
  }

  function switchAuthMode(nextMode: AuthMode) {
    setAuthMode(nextMode);
    setAuthMessage("");
    setAuthDisplayName("");
    setAuthPassword("");
  }

  return (
    <PageShell
      description="Customer account center for purchase history, saved carts, repeat ordering, and contractor terms."
      eyebrow="Gateworks Customer"
      title="Purchase history"
    >
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-industrial-muted">
                Current Account
              </p>
              <h2 className="text-2xl font-black text-industrial-ink">
                {displayName}
                {isAuthenticated && email ? ` (${email})` : "Guest"}
              </h2>
              <p className="mt-1 text-sm text-industrial-steel">Account key: {userId}</p>
            </div>
            <Building2 size={24} />
          </CardHeader>
          <CardBody className="grid gap-4 sm:grid-cols-2">
            {isAuthenticated ? (
              <>
                <div className="rounded-lg border border-industrial-rail p-3">
                  <p className="text-sm font-bold text-industrial-ink">
                    Signed in and ready to review purchase history.
                  </p>
                  <p className="mt-2 text-sm text-industrial-steel">
                    Keep this account handy for repeat ordering and order-status tracking.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      resetUser();
                      setAuthMessage("Signed out.");
                    }}
                    size="sm"
                    variant="danger"
                  >
                    <LogOut size={15} />
                    Sign out
                  </Button>
                  <p className="text-xs text-industrial-muted">
                    Sign out anytime; your order history is kept under this account while signed in.
                  </p>
                </div>
              </>
            ) : (
              <>
                <form className="grid gap-3" onSubmit={handleAuthSubmit}>
                  <p className="text-sm font-black text-industrial-ink">
                    {authMode === "register" ? "Create a Shopper Account" : "Sign in to your account"}
                  </p>
                  {authMode === "register" ? (
                    <label className="grid gap-2 text-sm font-bold text-industrial-ink">
                      Account name
                      <input
                        autoComplete="name"
                        className="h-11 border border-industrial-rail px-3 text-sm outline-none focus:border-industrial-ink"
                        name="accountName"
                        required
                        type="text"
                        value={authDisplayName}
                        onChange={(event) => setAuthDisplayName(event.target.value)}
                      />
                    </label>
                  ) : null}
                  <label className="grid gap-2 text-sm font-bold text-industrial-ink">
                    Email
                    <input
                      autoComplete="email"
                      className="h-11 border border-industrial-rail px-3 text-sm outline-none focus:border-industrial-ink"
                      name="email"
                      required
                      type="email"
                      value={authEmail}
                      onChange={(event) => setAuthEmail(event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-industrial-ink">
                    Password
                    <input
                      autoComplete={authMode === "register" ? "new-password" : "current-password"}
                      className="h-11 border border-industrial-rail px-3 text-sm outline-none focus:border-industrial-ink"
                      name="password"
                      required
                      minLength={6}
                      type="password"
                      value={authPassword}
                      onChange={(event) => setAuthPassword(event.target.value)}
                    />
                  </label>
                  {authMessage ? (
                    <p className="border border-industrial-rail bg-industrial-paper p-3 text-sm text-industrial-ink">
                      {authMessage}
                    </p>
                  ) : null}
                  <button
                    className="h-11 bg-industrial-ink px-4 text-sm font-black uppercase tracking-[0.1em] text-white disabled:opacity-60"
                    disabled={isAuthSubmitting}
                    type="submit"
                  >
                    {isAuthSubmitting
                      ? "Please wait"
                      : authMode === "register"
                        ? "Create account"
                        : "Sign in"}
                  </button>
                  <button
                    className="text-sm text-industrial-ink underline"
                    onClick={() => switchAuthMode(authMode === "register" ? "login" : "register")}
                    type="button"
                  >
                    {authMode === "register" ? "Already have an account?" : "Need to create an account?"}
                  </button>
                </form>
                <div className="grid gap-2 rounded-lg border border-industrial-rail p-3">
                  <p className="text-sm font-black text-industrial-ink">Why create an account?</p>
                  <p className="text-sm text-industrial-steel">
                    Keep purchase history tied to one shopper account and quickly track status from the same
                    login.
                  </p>
                  <div className="mt-1 flex gap-2 text-xs font-black uppercase tracking-[0.1em] text-industrial-muted">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck size={14} />
                      Order history by account
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <UserPlus size={14} />
                      Repeat order context
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardBody>
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
                  Purchase History
                </p>
                <h2 className="text-xl font-black text-industrial-ink">
                  Recent orders and quote requests
                </h2>
              </div>
              <Clock size={20} />
            </CardHeader>
            <CardBody className="grid gap-3">
              {orders.length ? (
                orders.map((order) => (
                  <div
                    className="grid gap-3 border border-industrial-rail p-3 lg:grid-cols-[1fr_auto]"
                    key={order.id}
                  >
                    <div>
                      <p className="font-black text-industrial-ink">{order.orderNumber}</p>
                      <p className="mt-1 text-sm text-industrial-steel">
                        {order.jobName || order.companyName || order.customerName} /{" "}
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-industrial-muted">
                        {order.status} / {order.fulfillmentMethod} / {order.requestedWindow}
                      </p>
                      <div className="mt-3 max-w-xl">
                        <OrderProgressBar
                          fulfillmentMethod={order.fulfillmentMethod}
                          status={order.status}
                          compact
                        />
                      </div>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-xl font-black text-industrial-ink">
                        {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-industrial-steel">{order.items.length} SKUs</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid place-items-center border border-dashed border-industrial-rail p-10 text-center">
                  <FileText size={28} />
                  <p className="mt-3 text-sm font-semibold text-industrial-steel">
                    {isAuthenticated
                      ? "No orders yet. Submit a checkout or quote request to build order history."
                      : "Sign in to see your purchase history for this account."}
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
                          <Button
                            className="w-full"
                            onClick={() => replaceCart(cart.items)}
                            size="sm"
                            variant="primary"
                          >
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
                <h2 className="text-xl font-black text-industrial-ink">
                  Contractor terms
                </h2>
              </CardHeader>
              <CardBody className="grid gap-3 text-sm leading-6 text-industrial-steel">
                <p>
                  Contractor pricing, saved jobsites, tax exempt status, approvals, and net terms are
                  structured for the next Supabase-backed account tables.
                </p>
                <Link href="/checkout">
                  <Button className="w-full">
                    <LogIn size={15} />
                    Start checkout
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
