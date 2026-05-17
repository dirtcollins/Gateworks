"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Bookmark,
  Building2,
  CheckCircle2,
  ClipboardList,
  LogOut,
  Package,
  ReceiptText,
  RotateCcw,
  Trash2
} from "lucide-react";
import {
  Breadcrumb,
  Card,
  Eyebrow,
  LedgerPage,
  LEDGER,
  Pill,
  formatUsd
} from "./kit";
import { useLedgerScope } from "./scope";
import { useUserStore } from "@/lib/user-store";
import { useOrderStore } from "@/lib/order-store";
import { useCartStore } from "@/lib/cart-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import { useListStore } from "@/lib/list-store";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(value));
}

type Tab = "overview" | "orders" | "saved" | "lists";
type AuthMode = "login" | "register";

const openStatuses = new Set([
  "draft",
  "submitted",
  "confirmed",
  "picking",
  "ready_for_pickup",
  "out_for_delivery"
]);

/* Ledger account dashboard — consolidates the original separate
 * account, purchase-history, saved-lists, and saved-carts pages into
 * one tabbed area: account/auth, order ledger, saved POs, reorder
 * lists. Reads the real user/order/cart/list stores and Supabase. */
export function LedgerAccountView() {
  const hydrated = useLedgerScope();
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
  const lists = useListStore((state) => state.lists);
  const addCartItem = useCartStore((state) => state.addItem);

  const [tab, setTab] = useState<Tab>("overview");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const canLoadRemote = isAuthenticated || userId !== "guest";

  useEffect(() => {
    if (!canLoadRemote) return;
    async function load() {
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
        const payload = (await ordersResponse.json().catch(() => null)) as
          | { orders?: typeof orders; persisted?: boolean }
          | null;
        if (payload?.persisted && payload.orders) setOrders(payload.orders);
      }
      if (cartsResponse?.ok) {
        const payload = (await cartsResponse.json().catch(() => null)) as
          | { carts?: typeof carts; persisted?: boolean }
          | null;
        if (payload?.persisted && payload.carts) setCarts(payload.carts);
      }
    }
    void load();
  }, [canLoadRemote, setCarts, setOrders, userId]);

  const openOrders = useMemo(
    () => orders.filter((order) => openStatuses.has(order.status)),
    [orders]
  );
  const lifetimeSpend = useMemo(
    () => orders.reduce((total, order) => total + order.total, 0),
    [orders]
  );
  const listItemCount = lists.reduce(
    (total, list) => total + list.items.length,
    0
  );

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthMessage("");
    try {
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
      setAuthMessage(
        authMode === "register" ? "Account created." : "Welcome back."
      );
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
    } finally {
      setAuthBusy(false);
    }
  }

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Order ledger", count: orders.length },
    { id: "saved", label: "Saved POs", count: carts.length },
    { id: "lists", label: "Reorder lists", count: lists.length }
  ];

  const stats = [
    { label: "Lifetime spend", value: formatUsd(lifetimeSpend) },
    { label: "Total orders", value: String(orders.length) },
    { label: "Open orders", value: String(openOrders.length) },
    { label: "Saved templates", value: String(carts.length) }
  ];

  return (
    <LedgerPage>
      <div className="py-5">
        <Breadcrumb
          trail={[{ label: "Overview", href: "/ledger" }, { label: "Account" }]}
        />
      </div>

      <header
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: LEDGER.ink }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Procurement account</Eyebrow>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {isAuthenticated ? displayName : "Your account"}
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              {isAuthenticated && email
                ? `${email} · Account #GW-40128`
                : "Sign in to track orders, save purchase orders, and manage reorder lists."}
            </p>
          </div>
          {isAuthenticated ? (
            <button
              className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition"
              onClick={() => resetUser()}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.85)"
              }}
              type="button"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-3 py-8">
        {/* Stat grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-4">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: LEDGER.muted }}
              >
                {stat.label}
              </p>
              <p
                className="mt-2 text-2xl font-semibold tracking-tight"
                style={{ color: LEDGER.ink }}
              >
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {tabs.map((tabItem) => {
            const active = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                className="rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition"
                onClick={() => setTab(tabItem.id)}
                style={{
                  backgroundColor: active ? LEDGER.indigo : LEDGER.surface,
                  color: active ? "#ffffff" : LEDGER.body,
                  border: `1px solid ${active ? LEDGER.indigo : LEDGER.line}`
                }}
                type="button"
              >
                {tabItem.label}
                {typeof tabItem.count === "number"
                  ? ` (${tabItem.count})`
                  : ""}
              </button>
            );
          })}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" ? (
          <div className="grid gap-3 lg:grid-cols-12">
            <Card className="p-5 lg:col-span-7">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: LEDGER.indigo }} />
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: LEDGER.muted }}
                >
                  {isAuthenticated ? "Account profile" : "Sign in or register"}
                </p>
              </div>
              {isAuthenticated ? (
                <div className="mt-3 grid gap-2.5 text-[13px]">
                  <div className="flex justify-between">
                    <span style={{ color: LEDGER.body }}>Account holder</span>
                    <span style={{ color: LEDGER.ink, fontWeight: 600 }}>
                      {displayName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: LEDGER.body }}>Email</span>
                    <span style={{ color: LEDGER.ink, fontWeight: 600 }}>
                      {email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: LEDGER.body }}>Account key</span>
                    <span style={{ color: LEDGER.ink, fontWeight: 600 }}>
                      {userId}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: LEDGER.body }}>Terms</span>
                    <Pill bg={LEDGER.mintSoft} fg={LEDGER.mint}>
                      Net-30 active
                    </Pill>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ color: LEDGER.body }}>Pricing tier</span>
                    <Pill bg={LEDGER.indigoSoft} fg={LEDGER.indigo}>
                      Tier 2 volume
                    </Pill>
                  </div>
                </div>
              ) : (
                <form className="mt-3 grid gap-2.5" onSubmit={handleAuth}>
                  {authMode === "register" ? (
                    <input
                      aria-label="Account name"
                      autoComplete="name"
                      className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                      onChange={(event) => setAuthName(event.target.value)}
                      placeholder="Account name"
                      required
                      style={{
                        border: `1px solid ${LEDGER.line}`,
                        color: LEDGER.ink
                      }}
                      value={authName}
                    />
                  ) : null}
                  <input
                    aria-label="Email"
                    autoComplete="email"
                    className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    onChange={(event) => setAuthEmail(event.target.value)}
                    placeholder="Email"
                    required
                    style={{
                      border: `1px solid ${LEDGER.line}`,
                      color: LEDGER.ink
                    }}
                    type="email"
                    value={authEmail}
                  />
                  <input
                    aria-label="Password"
                    autoComplete={
                      authMode === "register"
                        ? "new-password"
                        : "current-password"
                    }
                    className="rounded-xl px-3 py-2.5 text-[13px] outline-none"
                    minLength={6}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="Password"
                    required
                    style={{
                      border: `1px solid ${LEDGER.line}`,
                      color: LEDGER.ink
                    }}
                    type="password"
                    value={authPassword}
                  />
                  {authMessage ? (
                    <p
                      className="rounded-xl px-3 py-2 text-[12px] font-semibold"
                      style={{
                        backgroundColor: LEDGER.indigoSoft,
                        color: LEDGER.indigo
                      }}
                    >
                      {authMessage}
                    </p>
                  ) : null}
                  <button
                    className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-white transition"
                    disabled={authBusy}
                    style={{
                      backgroundColor: LEDGER.indigo,
                      opacity: authBusy ? 0.6 : 1
                    }}
                    type="submit"
                  >
                    {authBusy
                      ? "Please wait…"
                      : authMode === "register"
                        ? "Create account"
                        : "Sign in"}
                  </button>
                  <button
                    className="text-[12px] font-semibold transition hover:underline"
                    onClick={() => {
                      setAuthMode(
                        authMode === "register" ? "login" : "register"
                      );
                      setAuthMessage("");
                    }}
                    style={{ color: LEDGER.indigo }}
                    type="button"
                  >
                    {authMode === "register"
                      ? "Already have an account? Sign in"
                      : "Need an account? Register"}
                  </button>
                </form>
              )}
            </Card>

            <Card className="p-5 lg:col-span-5">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Recent activity
              </p>
              {orders.length ? (
                <div className="mt-3 space-y-2">
                  {orders.slice(0, 4).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                      style={{ backgroundColor: LEDGER.canvas }}
                    >
                      <div className="min-w-0">
                        <p
                          className="truncate text-[13px] font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {order.orderNumber}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: LEDGER.muted }}
                        >
                          {formatDate(order.createdAt)} · {order.status}
                        </p>
                      </div>
                      <span
                        className="shrink-0 text-[13px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {formatUsd(order.total)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-[13px]" style={{ color: LEDGER.body }}>
                  No orders yet. Submit a purchase order to start your ledger.
                </p>
              )}
              <Link
                className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold transition hover:underline"
                href="/ledger/quotes"
                style={{ color: LEDGER.indigo }}
              >
                <ClipboardList className="h-4 w-4" /> Manage quotes
              </Link>
            </Card>
          </div>
        ) : null}

        {/* ORDER LEDGER */}
        {tab === "orders" ? (
          <Card>
            <div
              className="p-5"
              style={{ borderBottom: `1px solid ${LEDGER.line}` }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Order ledger
              </p>
            </div>
            {hydrated && !orders.length ? (
              <div className="p-12 text-center">
                <ReceiptText
                  className="mx-auto h-10 w-10"
                  style={{ color: LEDGER.muted }}
                />
                <p
                  className="mt-3 text-[13px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  {canLoadRemote
                    ? "No orders recorded for this account yet."
                    : "Sign in to view your order history."}
                </p>
              </div>
            ) : (
              <div>
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="grid gap-3 p-5 sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div>
                      <p
                        className="text-[14px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {order.orderNumber}
                        {order.isQuoteRequest ? " · Quote request" : ""}
                      </p>
                      <p className="text-[12px]" style={{ color: LEDGER.body }}>
                        {order.jobName ||
                          order.companyName ||
                          order.customerName ||
                          "—"}{" "}
                        · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill
                        bg={LEDGER.indigoSoft}
                        fg={LEDGER.indigo}
                      >
                        <span className="capitalize">{order.status}</span>
                      </Pill>
                      <span
                        className="text-[12px]"
                        style={{ color: LEDGER.muted }}
                      >
                        {order.fulfillmentMethod} · {order.items.length} SKU
                        {order.items.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p
                      className="text-[15px] font-semibold sm:text-right"
                      style={{ color: LEDGER.ink }}
                    >
                      {formatUsd(order.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}

        {/* SAVED POs */}
        {tab === "saved" ? (
          <Card>
            <div
              className="p-5"
              style={{ borderBottom: `1px solid ${LEDGER.line}` }}
            >
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: LEDGER.muted }}
              >
                Saved purchase orders
              </p>
            </div>
            {hydrated && !carts.length ? (
              <div className="p-12 text-center">
                <Bookmark
                  className="mx-auto h-10 w-10"
                  style={{ color: LEDGER.muted }}
                />
                <p
                  className="mt-3 text-[13px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  No saved purchase orders yet.
                </p>
                <p className="mt-1 text-[12px]" style={{ color: LEDGER.body }}>
                  Save a PO from the cart to reuse it for repeat jobs.
                </p>
              </div>
            ) : (
              <div>
                {carts.map((cart) => (
                  <div
                    key={cart.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-5"
                    style={{ borderBottom: `1px solid ${LEDGER.line}` }}
                  >
                    <div>
                      <p
                        className="text-[14px] font-semibold"
                        style={{ color: LEDGER.ink }}
                      >
                        {cart.name}
                      </p>
                      <p
                        className="text-[12px]"
                        style={{ color: LEDGER.body }}
                      >
                        {cart.items.length} SKU
                        {cart.items.length === 1 ? "" : "s"}
                        {cart.jobName ? ` · ${cart.jobName}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        className="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold text-white transition"
                        href="/ledger/cart"
                        onClick={() => replaceCart(cart.items)}
                        style={{ backgroundColor: LEDGER.indigo }}
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restore to PO
                      </Link>
                      <button
                        aria-label={`Delete ${cart.name}`}
                        className="grid h-9 w-9 place-items-center rounded-lg"
                        onClick={() => {
                          deleteCart(cart.id);
                          void fetch(
                            `/api/saved-carts?cartId=${encodeURIComponent(cart.id)}`,
                            { method: "DELETE" }
                          ).catch(() => null);
                        }}
                        style={{
                          border: `1px solid ${LEDGER.line}`,
                          color: LEDGER.muted
                        }}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ) : null}

        {/* REORDER LISTS */}
        {tab === "lists" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {lists.map((list) => (
              <Card key={list.id} className="p-5">
                <div className="flex items-center justify-between">
                  <p
                    className="text-[14px] font-semibold"
                    style={{ color: LEDGER.ink }}
                  >
                    {list.name}
                  </p>
                  <Pill bg={LEDGER.canvas} fg={LEDGER.muted}>
                    {list.items.length} item
                    {list.items.length === 1 ? "" : "s"}
                  </Pill>
                </div>
                {list.items.length ? (
                  <div className="mt-3 space-y-1.5">
                    {list.items.slice(0, 5).map((item) => (
                      <div
                        key={item.variantId}
                        className="flex items-center justify-between gap-3 text-[12px]"
                      >
                        <span
                          className="min-w-0 truncate"
                          style={{ color: LEDGER.body }}
                        >
                          {item.title}
                        </span>
                        <span
                          className="shrink-0 font-semibold"
                          style={{ color: LEDGER.ink }}
                        >
                          {formatUsd(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className="mt-3 text-[12px]"
                    style={{ color: LEDGER.body }}
                  >
                    Empty list — add products from catalog pages.
                  </p>
                )}
                {list.items.length ? (
                  <Link
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[12px] font-semibold text-white transition"
                    href="/ledger/cart"
                    onClick={() =>
                      list.items.forEach((item) => addCartItem(item))
                    }
                    style={{ backgroundColor: LEDGER.indigo }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Add list to PO
                  </Link>
                ) : null}
              </Card>
            ))}
            {hydrated && !lists.length ? (
              <Card className="p-12 text-center sm:col-span-2">
                <Package
                  className="mx-auto h-10 w-10"
                  style={{ color: LEDGER.muted }}
                />
                <p
                  className="mt-3 text-[13px] font-semibold"
                  style={{ color: LEDGER.ink }}
                >
                  No reorder lists yet.
                </p>
              </Card>
            ) : null}
            {lists.length ? (
              <Card
                className="flex items-center gap-2 p-4 text-[12px] sm:col-span-2"
                key="lists-hint"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0"
                  style={{ color: LEDGER.mint }}
                />
                <span style={{ color: LEDGER.body }}>
                  Reorder lists hold {listItemCount} saved item
                  {listItemCount === 1 ? "" : "s"} across {lists.length} list
                  {lists.length === 1 ? "" : "s"}. Add a whole list straight to
                  your purchase order.
                </span>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </LedgerPage>
  );
}
