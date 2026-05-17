"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck
} from "lucide-react";
import { D4Shell, brandClasses } from "./shell";

type Line = {
  id: number;
  name: string;
  variant: string;
  price: number;
  qty: number;
  stock: number;
  tint: string;
};

const INITIAL: Line[] = [
  {
    id: 1,
    name: "Heavy-Duty Cantilever Gate Roller Kit",
    variant: "Powder-coat black",
    price: 160,
    qty: 1,
    stock: 38,
    tint: "from-amber-200 to-amber-50"
  },
  {
    id: 2,
    name: "Self-Closing Gravity Gate Hinge — Pair",
    variant: "Galvanized",
    price: 54.99,
    qty: 2,
    stock: 120,
    tint: "from-emerald-200 to-emerald-50"
  },
  {
    id: 3,
    name: '1/2"-13 Hot-Dip Carriage Bolts — 50 ct',
    variant: "Box of 50",
    price: 22.75,
    qty: 3,
    stock: 480,
    tint: "from-violet-200 to-violet-50"
  }
];

const SUGGEST = [
  { name: "Anti-Sag Gate Kit", price: 24, tint: "from-rose-200 to-rose-50" },
  { name: "Gate Wheel Caster 6 in", price: 38.5, tint: "from-sky-200 to-sky-50" },
  { name: "Threadlocker — Blue", price: 9.99, tint: "from-orange-200 to-orange-50" }
];

export function D4Cart() {
  const [lines, setLines] = useState<Line[]>(INITIAL);
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState(false);

  const setQty = (id: number, delta: number) =>
    setLines((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, qty: Math.min(l.stock, Math.max(1, l.qty + delta)) }
          : l
      )
    );
  const remove = (id: number) =>
    setLines((prev) => prev.filter((l) => l.id !== id));

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.price * l.qty, 0),
    [lines]
  );
  const discount = applied ? subtotal * 0.1 : 0;
  const tax = (subtotal - discount) * 0.0825;
  const total = subtotal - discount + tax;
  const freeShipAt = 250;
  const toFree = Math.max(0, freeShipAt - subtotal);
  const progress = Math.min(100, (subtotal / freeShipAt) * 100);

  return (
    <D4Shell active="cart">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Your cart
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {lines.reduce((s, l) => s + l.qty, 0)} items · prices locked for 24
          hours
        </p>

        {lines.length === 0 ? (
          <div className="mt-8 grid place-items-center rounded-2xl bg-slate-50 py-20 text-center ring-1 ring-slate-100">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white text-orange-500 ring-1 ring-slate-100">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-bold text-slate-900">
              Your cart is empty
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Browse 2,200+ contractor-grade products with free same-day pickup.
            </p>
            <Link
              href="/design-lab/d4/category"
              className={`${brandClasses.btn} mt-5 px-6 py-3 text-sm`}
            >
              Start shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* Lines */}
            <div className="space-y-4">
              {/* free-ship meter */}
              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <Truck className="h-4 w-4" />
                  {toFree > 0 ? (
                    <>
                      Add{" "}
                      <span className="font-extrabold">
                        ${toFree.toFixed(2)}
                      </span>{" "}
                      for free local delivery
                    </>
                  ) : (
                    <>You&rsquo;ve unlocked free local delivery!</>
                  )}
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {lines.map((l) => (
                <div
                  key={l.id}
                  className={`${brandClasses.card} flex gap-4 p-4`}
                >
                  <div
                    className={`h-24 w-24 shrink-0 rounded-xl bg-gradient-to-br ${l.tint}`}
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href="/design-lab/d4/product"
                          className="line-clamp-2 text-sm font-bold text-slate-900 hover:text-orange-600"
                        >
                          {l.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {l.variant}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <Check className="h-3.5 w-3.5" /> In stock · pickup
                          today
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l.id)}
                        aria-label="Remove item"
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-end justify-between pt-3">
                      <div className="flex items-center rounded-xl ring-1 ring-slate-200">
                        <button
                          type="button"
                          aria-label="Decrease"
                          onClick={() => setQty(l.id, -1)}
                          className="grid h-9 w-9 place-items-center text-slate-500 hover:text-orange-600"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-9 text-center text-sm font-bold">
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase"
                          onClick={() => setQty(l.id, 1)}
                          className="grid h-9 w-9 place-items-center text-slate-500 hover:text-orange-600"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-extrabold text-slate-900">
                          ${(l.price * l.qty).toFixed(2)}
                        </p>
                        <p className="text-xs text-slate-400">
                          ${l.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* suggestions */}
              <div className={`${brandClasses.card} p-4`}>
                <p className="text-sm font-bold text-slate-900">
                  Frequently added together
                </p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {SUGGEST.map((s) => (
                    <div
                      key={s.name}
                      className="rounded-xl bg-slate-50 p-3 text-center"
                    >
                      <div
                        className={`mx-auto h-14 w-14 rounded-lg bg-gradient-to-br ${s.tint}`}
                      />
                      <p className="mt-2 line-clamp-2 text-xs font-semibold text-slate-700">
                        {s.name}
                      </p>
                      <p className="text-xs font-bold text-slate-900">
                        ${s.price.toFixed(2)}
                      </p>
                      <button
                        type="button"
                        className="mt-1.5 text-xs font-bold text-orange-600 hover:text-orange-700"
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className={`${brandClasses.card} p-5`}>
                <p className="text-lg font-bold text-slate-900">
                  Order summary
                </p>

                {/* promo */}
                <div className="mt-4 flex gap-2">
                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <input
                      value={promo}
                      onChange={(e) => setPromo(e.target.value)}
                      placeholder="Promo code"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setApplied(promo.trim().length > 0)}
                    className={`${brandClasses.btnSoft} px-4 text-sm`}
                  >
                    Apply
                  </button>
                </div>
                {applied ? (
                  <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <Check className="h-3.5 w-3.5" /> PRO10 applied — 10% off
                  </p>
                ) : null}

                <dl className="mt-4 space-y-2.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Subtotal</dt>
                    <dd className="font-semibold text-slate-900">
                      ${subtotal.toFixed(2)}
                    </dd>
                  </div>
                  {applied ? (
                    <div className="flex justify-between text-emerald-600">
                      <dt>Discount (PRO10)</dt>
                      <dd className="font-semibold">
                        -${discount.toFixed(2)}
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Pickup</dt>
                    <dd className="font-semibold text-emerald-600">Free</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Est. tax</dt>
                    <dd className="font-semibold text-slate-900">
                      ${tax.toFixed(2)}
                    </dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                    <dt className="font-bold text-slate-900">Total</dt>
                    <dd className="font-extrabold text-slate-900">
                      ${total.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <Link
                  href="/design-lab/d4/home"
                  className={`${brandClasses.btn} mt-5 w-full px-5 py-3.5 text-base`}
                >
                  <Lock className="h-4 w-4" /> Checkout securely
                </Link>
                <Link
                  href="/design-lab/d4/category"
                  className="mt-2 block text-center text-sm font-semibold text-slate-500 hover:text-orange-600"
                >
                  Continue shopping
                </Link>

                <div className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2.5 text-xs font-semibold text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  256-bit secure · 90-day returns
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-900 p-4 text-white">
                <p className="text-sm font-bold">Pay with a trade account</p>
                <p className="mt-0.5 text-xs text-slate-300">
                  Net-30 terms available at checkout for verified pros.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </D4Shell>
  );
}
