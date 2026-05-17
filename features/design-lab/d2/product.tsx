"use client";

/** DESIGN 2 — Warehouse Dark · Product detail */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Truck
} from "lucide-react";
import {
  AccentButton,
  D2,
  D2Shell,
  Panel,
  PanelHead,
  PartImage,
  Tag,
  mono
} from "./kit";

const PRODUCT = {
  id: "GW-7740",
  name: 'Heavy-Duty Bolt-On Gate Hinge — 6" Weld-Free',
  category: "Gate Hardware",
  basePrice: 38.5,
  rating: 4.8,
  reviews: 214,
  blurb:
    "Forged-body bolt-on hinge engineered for swing gates up to 14ft / 600lb. Self-lubricating bronze bushing, zinc-plated against yard corrosion. Installs with no welding — square-tube clamp pattern fits 2\" to 4\" frames.",
  views: [
    { code: "FRONT", seed: "GW-7740-A" },
    { code: "PROFILE", seed: "GW-7740-B" },
    { code: "HARDWARE", seed: "GW-7740-C" },
    { code: "INSTALLED", seed: "GW-7740-D" }
  ],
  specs: [
    ["Load rating", "600 lb / leaf"],
    ["Body material", "Forged carbon steel"],
    ["Finish", "Hot-dip zinc, RoHS"],
    ["Pin diameter", '0.625 in (5/8")'],
    ["Frame fit", '2.0" – 4.0" square tube'],
    ["Pack weight", "3.4 lb"],
    ["Origin", "Lot mill-certified · US"],
    ["SKU lifecycle", "Active · stocked"]
  ]
};

const TIERS = [
  { qty: "1 – 23", price: 38.5, label: "List" },
  { qty: "24 – 99", price: 34.65, label: "Crew −10%" },
  { qty: "100 – 499", price: 30.8, label: "Contractor −20%" },
  { qty: "500+", price: 26.95, label: "Yard −30%" }
];

function unitPriceFor(qty: number) {
  if (qty >= 500) return 26.95;
  if (qty >= 100) return 30.8;
  if (qty >= 24) return 34.65;
  return 38.5;
}

export function D2Product() {
  const [qty, setQty] = useState(24);
  const [view, setView] = useState(0);
  const [added, setAdded] = useState(false);

  const unit = useMemo(() => unitPriceFor(qty), [qty]);
  const subtotal = unit * qty;
  const savings = (PRODUCT.basePrice - unit) * qty;

  return (
    <D2Shell active="product" kicker="PRODUCT // SPEC SHEET">
      {/* breadcrumb */}
      <div
        className={`${mono} mb-5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider`}
        style={{ color: D2.muted }}
      >
        <Link href="/design-lab/d2/home">Storefront</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/design-lab/d2/category">{PRODUCT.category}</Link>
        <ChevronRight className="h-3 w-3" />
        <span style={{ color: D2.accent }}>{PRODUCT.id}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        {/* gallery */}
        <Panel>
          <PanelHead title="Visual" meta={PRODUCT.views[view].code} />
          <div className="p-4">
            <PartImage
              seed={PRODUCT.views[view].seed}
              className="aspect-[4/3] w-full"
              label={`${PRODUCT.id} · ${PRODUCT.views[view].code}`}
            />
            <div className="mt-3 grid grid-cols-4 gap-3">
              {PRODUCT.views.map((v, i) => (
                <button
                  key={v.code}
                  type="button"
                  onClick={() => setView(i)}
                  className="rounded-[4px] p-1 transition"
                  style={{
                    border: `1px solid ${i === view ? D2.accent : D2.line}`,
                    boxShadow: i === view ? `0 0 14px ${D2.accent}33` : undefined
                  }}
                >
                  <PartImage seed={v.seed} className="aspect-square w-full" />
                  <span
                    className={`${mono} mt-1 block text-center text-[9px] uppercase`}
                    style={{ color: i === view ? D2.accent : D2.muted }}
                  >
                    {v.code}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Panel>

        {/* buy box */}
        <div className="flex flex-col gap-6">
          <Panel className="p-5">
            <div className="flex items-center gap-2">
              <Tag tone="accent">{PRODUCT.id}</Tag>
              <Tag tone="muted">★ {PRODUCT.rating} · {PRODUCT.reviews}</Tag>
            </div>
            <h1 className="mt-3 text-[24px] font-bold leading-tight">{PRODUCT.name}</h1>
            <p className="mt-3 text-[13px] leading-relaxed" style={{ color: D2.muted }}>
              {PRODUCT.blurb}
            </p>

            {/* price + qty */}
            <div
              className="mt-5 rounded-[5px] p-4"
              style={{ background: D2.panelHi, border: `1px solid ${D2.line}` }}
            >
              <div className="flex items-end justify-between">
                <div>
                  <div
                    className={`${mono} text-[10px] uppercase tracking-[0.16em]`}
                    style={{ color: D2.muted }}
                  >
                    Unit price @ {qty}
                  </div>
                  <div className={`${mono} text-[34px] font-bold leading-none`}>
                    <span style={{ color: D2.accent }}>${unit.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${mono} text-[11px]`} style={{ color: D2.muted }}>
                    Subtotal
                  </div>
                  <div className={`${mono} text-[18px] font-bold`}>
                    ${subtotal.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div
                  className="flex items-center rounded-[3px]"
                  style={{ border: `1px solid ${D2.line}`, background: D2.bg }}
                >
                  <button
                    type="button"
                    aria-label="decrease"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="grid h-11 w-11 place-items-center"
                    style={{ color: D2.accent }}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))
                    }
                    className={`${mono} h-11 w-16 bg-transparent text-center text-[16px] font-bold outline-none`}
                  />
                  <button
                    type="button"
                    aria-label="increase"
                    onClick={() => setQty((q) => q + 1)}
                    className="grid h-11 w-11 place-items-center"
                    style={{ color: D2.accent }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <AccentButton
                  className="flex-1"
                  onClick={() => {
                    setAdded(true);
                    window.setTimeout(() => setAdded(false), 1600);
                  }}
                >
                  {added ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Added to cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" /> Add to cart
                    </>
                  )}
                </AccentButton>
              </div>

              {savings > 0 ? (
                <div
                  className={`${mono} mt-3 text-[11px]`}
                  style={{ color: D2.accent }}
                >
                  ✓ Volume tier active — saving ${savings.toFixed(2)} vs list
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { icon: Truck, t: "Ships today", s: "Order by 1pm MT" },
                { icon: ShieldCheck, t: "Mill certified", s: "Lot docs included" }
              ].map((x) => (
                <div
                  key={x.t}
                  className="flex items-center gap-2.5 rounded-[3px] px-3 py-2.5"
                  style={{ border: `1px solid ${D2.line}` }}
                >
                  <x.icon className="h-4 w-4 shrink-0" style={{ color: D2.accent }} />
                  <div>
                    <div className="text-[12px] font-semibold">{x.t}</div>
                    <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                      {x.s}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* volume tiers */}
          <Panel>
            <PanelHead title="Volume Pricing" meta="QTY BREAKS" />
            <div>
              {TIERS.map((t, i) => {
                const on = unit === t.price;
                return (
                  <div
                    key={t.qty}
                    className="flex items-center justify-between px-4 py-3"
                    style={{
                      borderTop: i > 0 ? `1px solid ${D2.line}` : undefined,
                      background: on ? `${D2.accent}10` : undefined
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: on ? D2.accent : D2.line }}
                      />
                      <span className={`${mono} text-[12px]`}>{t.qty}</span>
                      <Tag tone={on ? "accent" : "muted"}>{t.label}</Tag>
                    </div>
                    <span
                      className={`${mono} text-[14px] font-bold`}
                      style={{ color: on ? D2.accent : D2.text }}
                    >
                      ${t.price.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>

      {/* spec sheet */}
      <Panel className="mt-6">
        <PanelHead
          title="Spec Sheet"
          meta="DATASHEET GW-7740"
          action={
            <span
              className={`${mono} flex items-center gap-1.5 text-[11px] uppercase`}
              style={{ color: D2.accent }}
            >
              <FileText className="h-3.5 w-3.5" /> PDF
            </span>
          }
        />
        <div className="grid sm:grid-cols-2">
          {PRODUCT.specs.map(([k, v], i) => (
            <div
              key={k}
              className="flex items-center justify-between px-4 py-3"
              style={{
                borderTop: i > 1 ? `1px solid ${D2.line}` : undefined,
                borderLeft: i % 2 ? `1px solid ${D2.line}` : undefined
              }}
            >
              <span className={`${mono} text-[11px] uppercase`} style={{ color: D2.muted }}>
                {k}
              </span>
              <span className={`${mono} text-[12px] font-medium`}>{v}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* related */}
      <Panel className="mt-6">
        <PanelHead title="Pairs With" meta="3 ITEMS" />
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {[
            { id: "GW-2208", name: "Drop Rod Latch Assembly", price: 24.0 },
            { id: "GW-4417", name: "V-Track Roller — Cast", price: 19.95 },
            { id: "GW-3390", name: "Gate Anti-Sag Truss Kit", price: 52.25 }
          ].map((r, i) => (
            <Link
              key={r.id}
              href="/design-lab/d2/product"
              className="flex items-center gap-3 p-4 transition hover:bg-white/[0.02]"
              style={{ borderLeft: i > 0 ? `1px solid ${D2.line}` : undefined }}
            >
              <PartImage seed={r.id} className="h-16 w-16 shrink-0" />
              <div className="min-w-0">
                <div className={`${mono} text-[10px]`} style={{ color: D2.muted }}>
                  {r.id}
                </div>
                <div className="truncate text-[13px] font-medium">{r.name}</div>
                <div className={`${mono} text-[13px] font-bold`} style={{ color: D2.accent }}>
                  ${r.price.toFixed(2)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Panel>
    </D2Shell>
  );
}
