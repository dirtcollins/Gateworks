"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingCart, Trash2, Truck } from "lucide-react";
import { Button, Chip, FO, Panel, Shell, Stamp, Title } from "./kit";
import { cartItemSummary, money } from "./data";
import { useCartStore } from "@/lib/cart-store";

const TAX_RATE = 0.0725;
const CATEGORY_HREF = "/design-lab/d5/category";

export default function D5Cart() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const [hydrated, setHydrated] = useState(false);

  // The cart store uses skipHydration; rehydrate once on the client so SSR
  // and first client render agree (empty) before persisted data loads.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const lines = hydrated ? items : [];

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines]
  );
  const tax = subtotal * TAX_RATE;
  const fee = subtotal > 0 && subtotal < 750 ? 49 : 0;
  const total = subtotal + tax + fee;
  const unitCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <Shell crumb="Cart / will-call">
      <header
        className="flex flex-wrap items-end justify-between gap-3 p-6"
        style={{ background: FO.panel, border: `2px solid ${FO.line}` }}
      >
        <div>
          <Stamp>Will-call order</Stamp>
          <h1
            className="mt-3 text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl"
            style={{ color: FO.ink }}
          >
            Your cart
          </h1>
        </div>
        <Chip tone="hi">
          <ShoppingCart size={13} strokeWidth={3} />
          {unitCount} {unitCount === 1 ? "unit" : "units"}
        </Chip>
      </header>

      {lines.length === 0 ? (
        <div
          className="mt-6 flex flex-col items-center gap-5 px-6 py-20 text-center"
          style={{ background: FO.panel, border: `2px dashed ${FO.line}` }}
        >
          <span
            className="grid h-20 w-20 place-items-center"
            style={{ background: FO.hiSoft, color: FO.hi }}
          >
            <ShoppingCart size={36} strokeWidth={2.25} />
          </span>
          <div>
            <p
              className="text-2xl font-black uppercase tracking-[0.04em]"
              style={{ color: FO.ink }}
            >
              Cart's empty
            </p>
            <p
              className="mt-1.5 text-[12px] font-bold uppercase tracking-[0.1em]"
              style={{ color: FO.dim }}
            >
              Load up on gear and we'll stage it for pickup.
            </p>
          </div>
          <Button href={CATEGORY_HREF} size="lg" variant="primary">
            Browse the catalog <ArrowRight size={17} strokeWidth={2.75} />
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-px lg:grid-cols-[1fr_360px]" style={{ background: FO.line }}>
          {/* Lines */}
          <div className="flex flex-col gap-px" style={{ background: FO.line }}>
            {lines.map((line) => (
              <div
                key={line.variantId}
                className="flex gap-3.5 p-4"
                style={{ background: FO.panel }}
              >
                <div
                  className="grid h-24 w-24 shrink-0 place-items-center"
                  style={{ background: "#f4f1e9" }}
                >
                  {line.image ? (
                    <Image
                      alt={line.title}
                      src={line.image}
                      width={200}
                      height={200}
                      quality={75}
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-2xl font-black" style={{ color: "rgba(22,20,15,0.16)" }}>
                      GW
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.14em]"
                    style={{ color: FO.faint }}
                  >
                    {line.sku}
                  </span>
                  <Link
                    href="/design-lab/d5/product"
                    className="text-[14px] font-black uppercase leading-tight"
                    style={{ color: FO.ink }}
                  >
                    {line.title}
                  </Link>
                  <span
                    className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.08em]"
                    style={{ color: FO.dim }}
                  >
                    {cartItemSummary(line)} · {money(line.price)} ea
                  </span>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div className="flex items-stretch" style={{ border: `2px solid ${FO.line}` }}>
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          updateQuantity(line.variantId, Math.max(1, line.quantity - 1))
                        }
                        className="grid h-10 w-10 place-items-center"
                        style={{ background: FO.panelHi, color: FO.ink }}
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span
                        className="grid h-10 w-12 place-items-center text-base font-black"
                        style={{
                          color: FO.ink,
                          borderLeft: `2px solid ${FO.line}`,
                          borderRight: `2px solid ${FO.line}`
                        }}
                      >
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => updateQuantity(line.variantId, line.quantity + 1)}
                        className="grid h-10 w-10 place-items-center"
                        style={{ background: FO.panelHi, color: FO.ink }}
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                    <span className="text-xl font-black" style={{ color: FO.hi }}>
                      {money(line.price * line.quantity)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${line.title}`}
                  onClick={() => removeItem(line.variantId)}
                  className="grid h-10 w-10 shrink-0 place-items-center self-start"
                  style={{ background: FO.stopSoft, color: FO.stop }}
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                </button>
              </div>
            ))}

            <Link
              href={CATEGORY_HREF}
              className="flex items-center gap-2 p-4 text-[11px] font-black uppercase tracking-[0.12em]"
              style={{ background: FO.panel, color: FO.hi }}
            >
              <ArrowRight size={14} strokeWidth={2.75} className="rotate-180" />
              Keep shopping
            </Link>
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-px" style={{ background: FO.line }}>
            <div className="p-5" style={{ background: FO.panel }}>
              <h2
                className="text-[13px] font-black uppercase tracking-[0.16em]"
                style={{ color: FO.ink }}
              >
                Order total
              </h2>
              <div className="mt-4 flex flex-col gap-2.5 text-[13px] font-bold">
                <Row label="Subtotal" value={money(subtotal)} />
                <Row label="Tax (7.25%)" value={money(tax)} />
                <Row
                  label="Will-call / delivery"
                  value={fee === 0 ? "FREE" : money(fee)}
                  accent={fee === 0}
                />
              </div>
              <div
                className="mt-4 flex items-end justify-between pt-4"
                style={{ borderTop: `2px solid ${FO.line}` }}
              >
                <span
                  className="text-[12px] font-black uppercase tracking-[0.14em]"
                  style={{ color: FO.dim }}
                >
                  Total
                </span>
                <span className="text-3xl font-black" style={{ color: FO.hi }}>
                  {money(total)}
                </span>
              </div>
            </div>

            <div className="p-5" style={{ background: FO.panel }}>
              <Button full href="/design-lab/d5/orders" size="lg" variant="primary">
                Submit order <ArrowRight size={17} strokeWidth={2.75} />
              </Button>
              <div className="mt-3 grid gap-px" style={{ background: FO.line }}>
                {[
                  { icon: Truck, text: "Free will-call on orders over $750" },
                  { icon: ShieldCheck, text: "Secure trade checkout & net terms" }
                ].map((row) => (
                  <p
                    key={row.text}
                    className="flex items-center gap-2.5 p-3 text-[11px] font-bold uppercase tracking-[0.06em]"
                    style={{ background: FO.panelHi, color: FO.dim }}
                  >
                    <row.icon size={15} strokeWidth={2.5} style={{ color: FO.hi }} />
                    {row.text}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {lines.length > 0 ? (
        <Panel className="mt-6" title="On the jobsite" kicker="// pickup ready">
          <div className="flex items-center gap-3 p-5">
            <Title>
              <span style={{ color: FO.hi }}>{unitCount}</span>
            </Title>
            <p className="text-[13px] font-bold" style={{ color: FO.dim }}>
              units staged across {lines.length}{" "}
              {lines.length === 1 ? "line" : "lines"} — ready for same-day will-call.
            </p>
          </div>
        </Panel>
      ) : null}
    </Shell>
  );
}

function Row({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: FO.dim }}>{label}</span>
      <span className="font-black" style={{ color: accent ? FO.go : FO.ink }}>
        {value}
      </span>
    </div>
  );
}
