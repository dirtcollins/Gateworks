// Wayfinder — account. Consolidates the original site's three overlapping
// pages (account/auth, saved lists, purchase history) into one tabbed area:
//   • Overview  — sign-in / register + account stats
//   • Orders    — purchase history from the real @/lib/order-store + /api/orders
//   • Saved     — saved carts (@/lib/saved-cart-store, /api/saved-carts) and
//                 saved product lists (@/lib/list-store), with restore-to-cart
// Auth, order loading, and cart restore reuse the real stores and API routes;
// only the presentation is Wayfinder.
"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useOrderStore } from "@/lib/order-store";
import { useSavedCartStore } from "@/lib/saved-cart-store";
import { useListStore } from "@/lib/list-store";
import { useUserStore } from "@/lib/user-store";
import { Btn, Card, Eyebrow, Ico, Mono, fmt, monoFont, wf } from "./kit";
import { WfInput } from "./cart-page";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function formatDate(value: string) {
  return value ? dateFormatter.format(new Date(value)) : "—";
}

type Tab = "overview" | "orders" | "saved";
type AuthMode = "login" | "register";

export function WayfinderAccount() {
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
  const lists = useListStore((state) => state.lists);
  const replaceCart = useCartStore((state) => state.replaceCart);

  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    useCartStore.persist.rehydrate();
    useOrderStore.persist.rehydrate();
    useSavedCartStore.persist.rehydrate();
    useListStore.persist.rehydrate();
    setReady(true);
  }, []);

  const canLoadPersisted = isAuthenticated || userId !== "guest";

  useEffect(() => {
    if (!ready || !canLoadPersisted) return;

    async function loadAccountData() {
      const [ordersResponse, cartsResponse] = await Promise.all([
        fetch(`/api/orders?userId=${encodeURIComponent(userId)}&includeItems=false`, {
          cache: "no-store"
        }).catch(() => null),
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
  }, [ready, canLoadPersisted, userId, setOrders, setCarts]);

  const openOrders = useMemo(
    () => orders.filter((order) => !["completed", "cancelled"].includes(order.status)),
    [orders]
  );
  const orderValue = useMemo(
    () => orders.reduce((total, order) => total + order.total, 0),
    [orders]
  );
  const savedListItemCount = lists.reduce((count, list) => count + list.items.length, 0);

  async function handleAuthSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage("");
    setAuthBusy(true);
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
      setAuthMessage(authMode === "register" ? "Account created." : "Welcome back.");
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
    } finally {
      setAuthBusy(false);
    }
  }

  if (!ready) {
    return (
      <div style={{ padding: 64, textAlign: "center", color: wf.muted }}>
        <Mono>Loading account…</Mono>
      </div>
    );
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: `Orders (${orders.length})` },
    { id: "saved", label: `Saved (${carts.length + lists.length})` }
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <div style={{ borderBottom: `1px solid ${wf.rail}`, paddingBottom: 18, marginBottom: 20 }}>
        <Eyebrow>Account</Eyebrow>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.02em", margin: "6px 0 0" }}>
          {isAuthenticated && email ? `${displayName}` : "Your account"}
        </h1>
        <Mono style={{ fontSize: 12, color: wf.steel }}>
          {isAuthenticated && email ? email : "Guest"} · key {userId}
        </Mono>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {tabs.map((tabItem) => {
          const on = tab === tabItem.id;
          return (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setTab(tabItem.id)}
              style={{
                padding: "9px 16px",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                border: `1px solid ${on ? wf.ink : wf.rail}`,
                background: on ? wf.ink : "#fff",
                color: on ? "#fff" : wf.ink,
                cursor: "pointer"
              }}
            >
              {tabItem.label}
            </button>
          );
        })}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" ? (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12
            }}
          >
            {[
              { label: "Orders", value: String(orders.length) },
              { label: "Open", value: String(openOrders.length) },
              { label: "Saved carts", value: String(carts.length) },
              { label: "Lifetime value", value: fmt(orderValue) }
            ].map((stat) => (
              <Card key={stat.label} style={{ padding: 14 }}>
                <Eyebrow>{stat.label}</Eyebrow>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    margin: "8px 0 0",
                    letterSpacing: "-0.02em"
                  }}
                >
                  {stat.value}
                </p>
              </Card>
            ))}
          </div>

          {/* Auth */}
          <Card style={{ padding: 20 }}>
            {isAuthenticated ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap"
                }}
              >
                <div>
                  <Eyebrow>Signed in</Eyebrow>
                  <p style={{ fontSize: 15, fontWeight: 800, margin: "6px 0 0" }}>
                    {displayName}
                  </p>
                  <Mono style={{ fontSize: 12, color: wf.steel }}>{email}</Mono>
                  <p style={{ fontSize: 12, color: wf.steel, margin: "8px 0 0", maxWidth: 420 }}>
                    Orders, saved carts, and quotes are kept under this account
                    while you are signed in.
                  </p>
                </div>
                <Btn
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    resetUser();
                    setAuthMessage("Signed out.");
                  }}
                >
                  Sign out
                </Btn>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 320px)",
                  gap: 20
                }}
              >
                <form onSubmit={handleAuthSubmit} style={{ display: "grid", gap: 10 }}>
                  <Eyebrow>
                    {authMode === "register" ? "Create an account" : "Sign in"}
                  </Eyebrow>
                  {authMode === "register" ? (
                    <WfInput
                      placeholder="Account name"
                      value={authName}
                      onChange={setAuthName}
                    />
                  ) : null}
                  <WfInput
                    placeholder="Email"
                    type="email"
                    value={authEmail}
                    onChange={setAuthEmail}
                  />
                  <WfInput
                    placeholder="Password"
                    type="password"
                    value={authPassword}
                    onChange={setAuthPassword}
                  />
                  {authMessage ? (
                    <Mono
                      style={{
                        fontSize: 11,
                        color: wf.pine,
                        border: `1px solid ${wf.hairline}`,
                        padding: "6px 8px"
                      }}
                    >
                      {authMessage}
                    </Mono>
                  ) : null}
                  <Btn variant="primary" type="submit" block disabled={authBusy}>
                    {authBusy
                      ? "Please wait…"
                      : authMode === "register"
                        ? "Create account"
                        : "Sign in"}
                  </Btn>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === "register" ? "login" : "register");
                      setAuthMessage("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      color: wf.ink,
                      textDecoration: "underline",
                      justifySelf: "start"
                    }}
                  >
                    {authMode === "register"
                      ? "Already have an account? Sign in"
                      : "Need an account? Register"}
                  </button>
                </form>
                <div
                  style={{
                    border: `1px solid ${wf.hairline}`,
                    background: wf.bone,
                    padding: 16,
                    display: "grid",
                    gap: 8,
                    alignContent: "start"
                  }}
                >
                  <Eyebrow>Why an account?</Eyebrow>
                  <p style={{ fontSize: 13, color: wf.steel, margin: 0, lineHeight: 1.6 }}>
                    Keep purchase history, saved carts, and quotes tied to one
                    login — and track will-call status from the same place.
                  </p>
                  <Mono style={{ fontSize: 11, color: wf.muted }}>
                    Pro accounts unlock net terms at checkout.
                  </Mono>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* ORDERS */}
      {tab === "orders" ? (
        <div style={{ display: "grid", gap: 12 }}>
          {orders.length ? (
            orders.map((order) => (
              <Card key={order.id} style={{ padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 900, margin: 0 }}>
                      {order.orderNumber}
                    </p>
                    <Mono style={{ fontSize: 12, color: wf.steel, display: "block", marginTop: 2 }}>
                      {order.jobName || order.companyName || order.customerName} ·{" "}
                      {formatDate(order.createdAt)}
                    </Mono>
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {[
                        order.status,
                        order.fulfillmentMethod,
                        order.requestedWindow,
                        order.isQuoteRequest ? "quote request" : "order"
                      ]
                        .filter(Boolean)
                        .map((label) => (
                          <span
                            key={label}
                            style={{
                              fontFamily: monoFont,
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              padding: "3px 7px",
                              border: `1px solid ${wf.rail}`,
                              color: wf.steel
                            }}
                          >
                            {label}
                          </span>
                        ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>
                      {fmt(order.total)}
                    </p>
                    <Mono style={{ fontSize: 11, color: wf.steel }}>
                      {order.items.length} SKU{order.items.length === 1 ? "" : "s"}
                    </Mono>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card style={{ padding: 40, textAlign: "center" }}>
              <div style={{ display: "inline-flex", color: wf.muted, marginBottom: 8 }}>
                <Ico.receipt size={32} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>No orders yet.</p>
              <p style={{ fontSize: 13, color: wf.steel, margin: "6px 0 14px" }}>
                {isAuthenticated
                  ? "Place a checkout or submit a quote to build order history."
                  : "Sign in to see purchase history tied to your account."}
              </p>
              <Btn variant="primary" href="/search">
                Browse the catalog
              </Btn>
            </Card>
          )}
        </div>
      ) : null}

      {/* SAVED */}
      {tab === "saved" ? (
        <div style={{ display: "grid", gap: 20 }}>
          {/* Saved carts */}
          <div>
            <Eyebrow style={{ marginBottom: 10 }}>Saved carts · repeat ordering</Eyebrow>
            {carts.length ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 12
                }}
              >
                {carts.map((cart) => (
                  <Card key={cart.id} style={{ padding: 14 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{cart.name}</p>
                    <Mono style={{ fontSize: 11, color: wf.muted }}>
                      {cart.items.length} SKUs
                      {cart.jobName ? ` · ${cart.jobName}` : ""}
                    </Mono>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <Btn
                        size="xs"
                        variant="primary"
                        href="/cart"
                        onClick={() => replaceCart(cart.items)}
                        style={{ flex: 1 }}
                      >
                        Restore to cart
                      </Btn>
                      <Btn
                        size="xs"
                        variant="danger"
                        onClick={() => {
                          deleteCart(cart.id);
                          void fetch(
                            `/api/saved-carts?cartId=${encodeURIComponent(cart.id)}`,
                            { method: "DELETE" }
                          ).catch(() => null);
                        }}
                      >
                        <Ico.x size={12} />
                      </Btn>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card style={{ padding: 20, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: wf.steel, margin: 0 }}>
                  Save a cart from the cart page to enable one-click repeat orders.
                </p>
              </Card>
            )}
          </div>

          {/* Saved product lists */}
          <div>
            <Eyebrow style={{ marginBottom: 10 }}>
              Saved lists · {savedListItemCount} item{savedListItemCount === 1 ? "" : "s"}
            </Eyebrow>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 12
              }}
            >
              {lists.map((list) => (
                <Card key={list.id} style={{ padding: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{list.name}</p>
                    <Ico.star size={14} />
                  </div>
                  <Mono style={{ fontSize: 11, color: wf.muted }}>
                    {list.items.length} item{list.items.length === 1 ? "" : "s"}
                  </Mono>
                  {list.items.length ? (
                    <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                      {list.items.slice(0, 4).map((item) => (
                        <Mono
                          key={item.variantId}
                          style={{
                            fontSize: 11,
                            color: wf.steel,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {item.title}
                        </Mono>
                      ))}
                      <Btn
                        size="xs"
                        variant="default"
                        href="/cart"
                        onClick={() => replaceCart(list.items)}
                        style={{ marginTop: 6 }}
                      >
                        Restore to cart
                      </Btn>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: wf.muted, margin: "8px 0 0" }}>
                      Add products from a product page to fill this list.
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
