"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ClipboardList,
  LogOut,
  Package,
  RotateCcw,
  ShoppingCart,
  Trash2,
  UserRound
} from "lucide-react";
import { Eyebrow, IndustrialPage, formatUsd } from "./kit";
import { useUserStore } from "@/lib/user-store";
import { useOrderStore } from "@/lib/order-store";
import { useCartStore } from "@/lib/cart-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import {
  fetchQuotes,
  quoteDisplayName,
  type DbQuote
} from "./quote-data";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Account. Consolidates the original site's separate
 * account / saved-lists / purchase-history pages into one tabbed area:
 * Overview, Orders, Quotes, and Saved carts. Sign-in / register run
 * the real useUserStore auth; data loads from the real APIs.
 * ------------------------------------------------------------------ */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

type AccountTab = "overview" | "orders" | "quotes" | "carts";
type AuthMode = "login" | "register";

export function IndustrialAccount() {
  const displayName = useUserStore((state) => state.displayName);
  const email = useUserStore((state) => state.email);
  const userId = useUserStore((state) => state.userId);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const registerAccount = useUserStore((state) => state.registerAccount);
  const login = useUserStore((state) => state.login);
  const resetUser = useUserStore((state) => state.resetUser);

  const orders = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const carts = useSavedCartStore((state) => state.carts);
  const setCarts = useSavedCartStore((state) => state.setCarts);
  const deleteCart = useSavedCartStore((state) => state.deleteCart);
  const replaceCart = useCartStore((state) => state.replaceCart);

  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<AccountTab>("overview");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void useOrderStore.persist.rehydrate();
    void useSavedCartStore.persist.rehydrate();
    void useCartStore.persist.rehydrate();
    setReady(true);
  }, []);

  // Load the account's DB-backed quotes scoped to the signed-in user.
  useEffect(() => {
    let active = true;
    fetchQuotes(userId === "guest" ? {} : { siteUserId: userId }).then(
      (result) => {
        if (active) setQuotes(result.quotes);
      }
    );
    return () => {
      active = false;
    };
  }, [userId]);

  const canLoadRemote = isAuthenticated || userId !== "guest";

  useEffect(() => {
    if (!canLoadRemote) return;

    async function loadAccountData() {
      const [ordersResponse, cartsResponse] = await Promise.all([
        fetch(
          `/api/orders?userId=${encodeURIComponent(userId)}&includeItems=false`,
          { cache: "no-store" }
        ).catch(() => null),
        fetch(`/api/saved-carts?userId=${encodeURIComponent(userId)}`, {
          cache: "no-store"
        }).catch(() => null)
      ]);

      if (ordersResponse?.ok) {
        const payload = (await ordersResponse.json().catch(() => null)) as {
          orders?: typeof orders;
          persisted?: boolean;
        } | null;
        if (payload?.persisted && payload.orders) setOrders(payload.orders);
      }

      if (cartsResponse?.ok) {
        const payload = (await cartsResponse.json().catch(() => null)) as {
          carts?: typeof carts;
          persisted?: boolean;
        } | null;
        if (payload?.persisted && payload.carts) setCarts(payload.carts);
      }
    }

    void loadAccountData();
  }, [canLoadRemote, setCarts, setOrders, userId]);

  const orderList = ready ? orders : [];
  const quoteList = ready ? quotes : [];
  const cartList = ready ? carts : [];

  const openOrders = useMemo(
    () =>
      orderList.filter(
        (order) => !["completed", "cancelled"].includes(order.status)
      ),
    [orderList]
  );
  const orderValue = useMemo(
    () => orderList.reduce((total, order) => total + order.total, 0),
    [orderList]
  );

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setIsSubmitting(true);
    try {
      if (authMode === "register" && !authName.trim()) {
        setAuthMessage("Account name is required.");
        return;
      }
      const result =
        authMode === "register"
          ? await registerAccount({
              displayName: authName,
              email: authEmail,
              password: authPassword
            })
          : await login({ email: authEmail, password: authPassword });

      if (!result.ok) {
        setAuthMessage(result.reason || "Authentication failed.");
        return;
      }
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
    } finally {
      setIsSubmitting(false);
    }
  }

  const tabs: Array<{ id: AccountTab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: `Orders (${orderList.length})` },
    { id: "quotes", label: `Quotes (${quoteList.length})` },
    { id: "carts", label: `Saved carts (${cartList.length})` }
  ];

  return (
    <IndustrialPage>
      <section className="py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-3">
          <div>
            <Eyebrow>Customer account</Eyebrow>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
              {isAuthenticated ? displayName : "Your account"}
            </h1>
          </div>
          {isAuthenticated ? (
            <button
              className="flex items-center gap-2 border border-d1-ink bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
              onClick={resetUser}
              type="button"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          ) : null}
        </div>

        {!isAuthenticated ? (
          /* ---- Sign in / register ---- */
          <div className="mt-8 grid gap-8 lg:grid-cols-[400px_1fr]">
            <div className="border-2 border-d1-ink bg-white p-6">
              <div className="flex border border-d1-line">
                {(["login", "register"] as AuthMode[]).map((mode) => (
                  <button
                    className={`flex-1 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] transition ${
                      authMode === mode
                        ? "bg-d1-ink text-d1-paper"
                        : "bg-white text-d1-ink hover:bg-d1-card"
                    }`}
                    key={mode}
                    onClick={() => {
                      setAuthMode(mode);
                      setAuthMessage("");
                    }}
                    type="button"
                  >
                    {mode === "login" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
              <form className="mt-5 grid gap-3" onSubmit={handleAuthSubmit}>
                {authMode === "register" ? (
                  <label className="grid gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                      Account name
                    </span>
                    <input
                      autoComplete="name"
                      className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                      onChange={(event) => setAuthName(event.target.value)}
                      required
                      value={authName}
                    />
                  </label>
                ) : null}
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Email
                  </span>
                  <input
                    autoComplete="email"
                    className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    onChange={(event) => setAuthEmail(event.target.value)}
                    required
                    type="email"
                    value={authEmail}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    Password
                  </span>
                  <input
                    autoComplete={
                      authMode === "register" ? "new-password" : "current-password"
                    }
                    className="h-11 border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none focus:border-d1-ink"
                    minLength={6}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    required
                    type="password"
                    value={authPassword}
                  />
                </label>
                {authMessage ? (
                  <p className="border border-d1-line bg-d1-card px-3 py-2 text-[12px] font-bold text-d1-ink">
                    {authMessage}
                  </p>
                ) : null}
                <button
                  className="h-11 bg-d1-ink text-sm font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Please wait…"
                    : authMode === "register"
                      ? "Create account"
                      : "Sign in"}
                </button>
              </form>
            </div>
            <div className="border border-d1-line bg-d1-card p-6">
              <UserRound className="h-9 w-9 text-d1-pine" />
              <h2 className="mt-3 text-lg font-extrabold tracking-tight text-d1-ink">
                One account, every job
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-d1-steel">
                Sign in to keep purchase history, repeat-order carts, and
                contractor quotes tied to a single account. Orders placed at
                checkout and quotes built at the trade desk appear here for
                fast reordering.
              </p>
              <div className="mt-4 grid gap-2 text-[13px] font-semibold text-d1-ink">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-d1-pine" /> Order &amp; pickup
                  history
                </span>
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-d1-pine" /> Saved quotes
                  for net-terms jobs
                </span>
                <span className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-d1-pine" /> Repeat-order
                  carts
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ---- Signed-in account area ---- */
          <div className="mt-8">
            {/* Stats */}
            <div className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-4">
              {[
                { label: "Orders", value: String(orderList.length) },
                { label: "Open", value: String(openOrders.length) },
                { label: "Saved carts", value: String(cartList.length) },
                { label: "Lifetime value", value: formatUsd(orderValue) }
              ].map((stat) => (
                <div className="bg-d1-card px-5 py-4" key={stat.label}>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-d1-ink">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-6 flex flex-wrap gap-1.5 border-b border-d1-line pb-3">
              {tabs.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    className={`border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
                      active
                        ? "border-d1-ink bg-d1-ink text-d1-paper"
                        : "border-d1-line bg-white text-d1-ink hover:border-d1-ink"
                    }`}
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    type="button"
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              {tab === "overview" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="border border-d1-line bg-d1-card p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                      Account
                    </p>
                    <dl className="mt-3 grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-d1-steel">Name</dt>
                        <dd className="font-bold text-d1-ink">{displayName}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-d1-steel">Email</dt>
                        <dd className="font-bold text-d1-ink">
                          {email || "—"}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-d1-steel">Account key</dt>
                        <dd className="font-bold text-d1-ink">{userId}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="border border-d1-line bg-d1-card p-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-d1-pine">
                      Quick actions
                    </p>
                    <div className="mt-3 grid gap-2">
                      <Link
                        className="flex items-center justify-between border border-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                        href="/industrial/search"
                      >
                        Browse catalog
                      </Link>
                      <Link
                        className="flex items-center justify-between border border-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                        href="/industrial/quote"
                      >
                        Build a quote
                      </Link>
                      <Link
                        className="flex items-center justify-between border border-d1-ink px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                        href="/industrial/cart"
                      >
                        Go to cart
                      </Link>
                    </div>
                  </div>
                </div>
              ) : null}

              {tab === "orders" ? (
                orderList.length ? (
                  <div className="grid gap-px border border-d1-line bg-d1-line">
                    {orderList.map((order) => (
                      <div
                        className="grid gap-3 bg-d1-card p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                        key={order.id}
                      >
                        <div>
                          <p className="text-sm font-bold text-d1-ink">
                            {order.orderNumber}
                          </p>
                          <p className="mt-0.5 text-[12px] text-d1-steel">
                            {order.jobName ||
                              order.companyName ||
                              order.customerName}{" "}
                            · {dateFormatter.format(new Date(order.createdAt))}
                          </p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-d1-steel">
                            {order.status} · {order.fulfillmentMethod} ·{" "}
                            {order.paymentStatus}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-lg font-extrabold text-d1-ink">
                            {formatUsd(order.total)}
                          </p>
                          <p className="text-[12px] text-d1-steel">
                            {order.items.length} SKUs
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-d1-line bg-d1-card px-6 py-16 text-center">
                    <Package className="mx-auto h-9 w-9 text-d1-line" />
                    <p className="mt-3 text-sm font-bold text-d1-ink">
                      No orders yet.
                    </p>
                    <p className="mt-1 text-[13px] text-d1-steel">
                      Place an order at checkout to build purchase history.
                    </p>
                  </div>
                )
              ) : null}

              {tab === "quotes" ? (
                quoteList.length ? (
                  <div className="grid gap-px border border-d1-line bg-d1-line">
                    {quoteList.map((quote) => (
                      <div
                        className="grid gap-3 bg-d1-card p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                        key={quote.id}
                      >
                        <div>
                          <p className="text-sm font-bold text-d1-ink">
                            {quoteDisplayName(quote)}
                          </p>
                          <p className="mt-0.5 text-[12px] text-d1-steel">
                            {quote.quoteNumber} ·{" "}
                            {quote.customerName || "No customer"} ·{" "}
                            {quote.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-extrabold text-d1-ink">
                            {formatUsd(quote.total)}
                          </span>
                          <Link
                            className="border border-d1-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-ink transition hover:bg-d1-ink hover:text-d1-paper"
                            href={`/industrial/quotes/${quote.id}`}
                          >
                            Open
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-d1-line bg-d1-card px-6 py-16 text-center">
                    <ClipboardList className="mx-auto h-9 w-9 text-d1-line" />
                    <p className="mt-3 text-sm font-bold text-d1-ink">
                      No quotes yet.
                    </p>
                    <Link
                      className="mt-4 inline-flex items-center gap-2 bg-d1-ink px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                      href="/industrial/quote"
                    >
                      Build a quote
                    </Link>
                  </div>
                )
              ) : null}

              {tab === "carts" ? (
                cartList.length ? (
                  <div className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2">
                    {cartList.map((cart) => (
                      <div className="bg-d1-card p-4" key={cart.id}>
                        <p className="text-sm font-bold text-d1-ink">
                          {cart.name}
                        </p>
                        <p className="mt-0.5 text-[12px] text-d1-steel">
                          {cart.items.length} SKUs
                          {cart.jobName ? ` · ${cart.jobName}` : ""}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Link
                            className="flex flex-1 items-center justify-center gap-1.5 bg-d1-ink px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-d1-paper transition hover:bg-d1-pine"
                            href="/industrial/cart"
                            onClick={() => replaceCart(cart.items)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Reorder
                          </Link>
                          <button
                            aria-label={`Delete ${cart.name}`}
                            className="grid h-9 w-9 place-items-center border border-d1-line text-d1-steel transition hover:border-d1-red hover:text-d1-red"
                            onClick={() => {
                              deleteCart(cart.id);
                              void fetch(
                                `/api/saved-carts?cartId=${encodeURIComponent(cart.id)}`,
                                { method: "DELETE" }
                              ).catch(() => null);
                            }}
                            type="button"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-d1-line bg-d1-card px-6 py-16 text-center">
                    <ShoppingCart className="mx-auto h-9 w-9 text-d1-line" />
                    <p className="mt-3 text-sm font-bold text-d1-ink">
                      No saved carts.
                    </p>
                    <p className="mt-1 text-[13px] text-d1-steel">
                      Save a cart from the cart page for fast repeat ordering.
                    </p>
                  </div>
                )
              ) : null}
            </div>
          </div>
        )}
      </section>
    </IndustrialPage>
  );
}
