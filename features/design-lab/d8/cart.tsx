"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ClipboardList,
  FileText,
  Minus,
  Plus,
  Trash2
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import {
  BlueprintCard,
  D8Shell,
  Dimension,
  DraftingMark,
  ink,
  mono,
  usd
} from "./kit";

const TAX_RATE = 0.0825;

export function D8Cart() {
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Store uses skipHydration — rehydrate once on mount.
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const lineCount = items.length;
  const unitCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <D8Shell active="cart">
      <div className="mx-auto max-w-6xl px-5 py-9">
        <DraftingMark label="Document — BOM-OUT" />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-semibold tracking-tight sm:text-3xl"
              style={{ color: ink.chalk }}
            >
              Bill of Materials
            </h1>
            <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
              Every part scheduled for your build — priced, tallied and ready
              to issue.
            </p>
          </div>
          <span
            className={`${mono} rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em]`}
            style={{ borderColor: ink.line, color: ink.chalkFaint }}
          >
            {lineCount} lines · {unitCount} units
          </span>
        </div>

        {!hydrated ? (
          <BlueprintCard className="mt-8">
            <div className="px-5 py-20 text-center">
              <p
                className={`${mono} text-sm uppercase tracking-[0.2em]`}
                style={{ color: ink.chalkFaint }}
              >
                Loading drawing…
              </p>
            </div>
          </BlueprintCard>
        ) : items.length === 0 ? (
          <BlueprintCard className="mt-8">
            <div className="grid place-items-center px-5 py-20 text-center">
              <span
                className="grid h-14 w-14 place-items-center rounded-sm border"
                style={{ borderColor: ink.cyanDeep, color: ink.cyan }}
              >
                <ClipboardList className="h-6 w-6" />
              </span>
              <p
                className="mt-4 text-lg font-semibold"
                style={{ color: ink.chalk }}
              >
                No materials scheduled
              </p>
              <p
                className="mt-1 max-w-sm text-sm"
                style={{ color: ink.chalkDim }}
              >
                Start a project and add components — they&rsquo;ll be drafted
                here as a working bill of materials.
              </p>
              <Link
                href="/design-lab/d8/home"
                className={`${mono} mt-5 inline-flex items-center gap-2 rounded-sm px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em]`}
                style={{ backgroundColor: ink.cyan, color: ink.groundDeep }}
              >
                Pick a project <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </BlueprintCard>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Schedule of materials */}
            <BlueprintCard className="overflow-hidden">
              <div
                className="grid grid-cols-[1fr_auto_auto] gap-3 border-b px-4 py-2.5"
                style={{ borderColor: ink.lineSoft }}
              >
                {["Component", "Qty", "Extended"].map((heading) => (
                  <span
                    key={heading}
                    className={`${mono} text-[10px] uppercase tracking-[0.2em] last:text-right`}
                    style={{ color: ink.chalkFaint }}
                  >
                    {heading}
                  </span>
                ))}
              </div>
              <div>
                {items.map((item, index) => {
                  const variantLabel =
                    [item.options?.length, item.options?.finish]
                      .filter((part) => part && part !== "Standard")
                      .join(" · ") || `SKU ${item.sku}`;
                  return (
                    <div
                      key={item.variantId}
                      className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b px-4 py-3.5 last:border-0"
                      style={{ borderColor: ink.lineSoft }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`${mono} hidden text-[11px] sm:block`}
                          style={{ color: ink.chalkFaint }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div
                          className="relative h-14 w-14 shrink-0 rounded-sm"
                          style={{ backgroundColor: ink.panelSoft }}
                        >
                          <Image
                            alt={item.title}
                            src={item.image || "/assets/logo.svg"}
                            fill
                            quality={75}
                            sizes="56px"
                            className="object-contain p-1.5"
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className="line-clamp-1 text-sm font-semibold"
                            style={{ color: ink.chalk }}
                          >
                            {item.title}
                          </p>
                          <p
                            className={`${mono} mt-0.5 text-[11px] uppercase tracking-[0.12em]`}
                            style={{ color: ink.chalkFaint }}
                          >
                            {variantLabel} · {usd(item.price)} ea
                          </p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            className={`${mono} mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em]`}
                            style={{ color: ink.amber }}
                          >
                            <Trash2 className="h-3 w-3" /> Strike line
                          </button>
                        </div>
                      </div>
                      <div
                        className="flex items-center rounded-sm border"
                        style={{ borderColor: ink.line }}
                      >
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity - 1)
                          }
                          className="grid h-8 w-8 place-items-center"
                          style={{ color: ink.chalkDim }}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span
                          className={`${mono} w-8 text-center text-xs font-semibold`}
                          style={{ color: ink.chalk }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() =>
                            updateQuantity(item.variantId, item.quantity + 1)
                          }
                          className="grid h-8 w-8 place-items-center"
                          style={{ color: ink.chalkDim }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span
                        className={`${mono} w-20 text-right text-sm font-semibold`}
                        style={{ color: ink.cyan }}
                      >
                        {usd(item.price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </BlueprintCard>

            {/* Cost roll-up / title block */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <BlueprintCard>
                <div
                  className="flex items-center gap-2 border-b px-4 py-2.5"
                  style={{ borderColor: ink.lineSoft }}
                >
                  <FileText className="h-4 w-4" style={{ color: ink.cyan }} />
                  <span
                    className={`${mono} text-[11px] uppercase tracking-[0.2em]`}
                    style={{ color: ink.chalkDim }}
                  >
                    Cost roll-up
                  </span>
                </div>
                <div className="px-4 py-4">
                  <dl className={`${mono} space-y-2.5 text-sm`}>
                    <div className="flex justify-between">
                      <dt style={{ color: ink.chalkDim }}>
                        Material subtotal
                      </dt>
                      <dd style={{ color: ink.chalk }}>{usd(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt style={{ color: ink.chalkDim }}>Tax · 8.25%</dt>
                      <dd style={{ color: ink.chalk }}>{usd(tax)}</dd>
                    </div>
                    <div
                      className="flex items-baseline justify-between border-t pt-2.5"
                      style={{ borderColor: ink.lineSoft }}
                    >
                      <dt
                        className="text-[11px] uppercase tracking-[0.2em]"
                        style={{ color: ink.chalkFaint }}
                      >
                        BOM total
                      </dt>
                      <dd
                        className="text-xl font-semibold"
                        style={{ color: ink.cyan }}
                      >
                        {usd(total)}
                      </dd>
                    </div>
                  </dl>

                  <div
                    className="mt-4 flex justify-center rounded-sm border py-2"
                    style={{ borderColor: ink.lineSoft }}
                  >
                    <Dimension
                      value={`${unitCount} units`}
                      hint="one issue"
                    />
                  </div>

                  <Link
                    href="/design-lab/d8/orders"
                    className={`${mono} mt-4 flex items-center justify-center gap-2 rounded-sm px-5 py-3.5 text-[12px] font-semibold uppercase tracking-[0.2em]`}
                    style={{ backgroundColor: ink.cyan, color: ink.groundDeep }}
                  >
                    Issue for build <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/design-lab/d8/category"
                    className={`${mono} mt-2 block text-center text-[11px] uppercase tracking-[0.16em]`}
                    style={{ color: ink.chalkDim }}
                  >
                    Add more components
                  </Link>
                </div>
              </BlueprintCard>

              <p
                className={`${mono} mt-3 text-[10px] leading-relaxed`}
                style={{ color: ink.chalkFaint }}
              >
                Issuing a complete BOM keeps the build single-trip — fewer
                return visits, higher basket value per order.
              </p>
            </aside>
          </div>
        )}
      </div>
    </D8Shell>
  );
}
