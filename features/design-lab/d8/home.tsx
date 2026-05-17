"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Boxes, CheckCircle2, PenTool, Wrench } from "lucide-react";
import {
  featuredProduct,
  newArrivals,
  popularProducts
} from "@/features/design-lab/live-data";
import {
  BlueprintCard,
  D8Shell,
  Dimension,
  DraftingMark,
  ink,
  mono,
  projectComponentCount,
  projects,
  usd
} from "./kit";

export function D8Home() {
  const hero = featuredProduct;
  const heroImage =
    hero.images[0]?.url ?? hero.variants[0]?.image ?? "/assets/logo.svg";
  const heroSku = hero.variants[0]?.sku ?? hero.id;

  /* Real catalog rails framed as build context. */
  const starterKit = popularProducts.slice(0, 4);
  const freshStock = newArrivals.slice(0, 6);

  return (
    <D8Shell active="home">
      {/* Hero — start from a project, not a SKU */}
      <section
        className="border-b"
        style={{ borderColor: ink.line, backgroundColor: ink.groundDeep }}
      >
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="flex flex-col justify-center">
            <DraftingMark label="Sheet 01 — Start here" />
            <h1
              className="mt-4 text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl"
              style={{ color: ink.chalk }}
            >
              Don&rsquo;t shop parts.
              <br />
              <span style={{ color: ink.cyan }}>Shop the build.</span>
            </h1>
            <p
              className="mt-4 max-w-md text-sm leading-relaxed"
              style={{ color: ink.chalkDim }}
            >
              Tell us what you&rsquo;re constructing — a sliding gate, a fence
              line, a weld bay — and the Build Desk lays out every component,
              measured and spec&rsquo;d, as one bill of materials.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/design-lab/d8/category"
                className={`${mono} inline-flex items-center gap-2 rounded-sm px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] transition`}
                style={{ backgroundColor: ink.cyan, color: ink.groundDeep }}
              >
                Open a project <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/design-lab/d8/product"
                className={`${mono} inline-flex items-center gap-2 rounded-sm border px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] transition`}
                style={{ borderColor: ink.line, color: ink.chalkDim }}
              >
                View a spec sheet
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { v: `${projects.length}`, k: "Guided builds" },
                {
                  v: `${popularProducts.length + newArrivals.length}+`,
                  k: "Stocked components"
                },
                { v: "1:1", k: "Drawing scale" }
              ].map((stat) => (
                <div key={stat.k}>
                  <p
                    className={`${mono} text-2xl font-semibold`}
                    style={{ color: ink.cyan }}
                  >
                    {stat.v}
                  </p>
                  <p
                    className={`${mono} text-[10px] uppercase tracking-[0.24em]`}
                    style={{ color: ink.chalkFaint }}
                  >
                    {stat.k}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Featured component, shown in build context */}
          <BlueprintCard className="overflow-hidden">
            <div
              className="flex items-center justify-between border-b px-4 py-2.5"
              style={{ borderColor: ink.lineSoft }}
            >
              <DraftingMark label="Keystone part" />
              <span
                className={`${mono} text-[10px] uppercase tracking-[0.24em]`}
                style={{ color: ink.chalkFaint }}
              >
                {hero.category.name}
              </span>
            </div>
            <div
              className="relative aspect-[4/3]"
              style={{ backgroundColor: ink.panelSoft }}
            >
              <Image
                alt={hero.title}
                src={heroImage}
                fill
                quality={75}
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-contain p-8"
                priority
              />
              <span
                className={`${mono} absolute left-3 top-3 text-[10px] uppercase tracking-[0.2em]`}
                style={{ color: ink.cyan }}
              >
                ◷ {heroSku}
              </span>
            </div>
            <div
              className="border-t px-4 py-4"
              style={{ borderColor: ink.lineSoft }}
            >
              <p
                className="text-sm font-semibold"
                style={{ color: ink.chalk }}
              >
                {hero.title}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <Dimension value={usd(hero.price)} hint="ea" />
                <Link
                  href="/design-lab/d8/product"
                  className={`${mono} inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em]`}
                  style={{ color: ink.cyan }}
                >
                  Spec sheet <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </BlueprintCard>
        </div>
      </section>

      {/* Project picker */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex items-end justify-between">
          <div>
            <DraftingMark label="Sheet 02 — Select your build" />
            <h2
              className="mt-3 text-2xl font-semibold tracking-tight"
              style={{ color: ink.chalk }}
            >
              Pick a project
            </h2>
            <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
              Each project is a real catalog stage with a measured component
              set ready to drop into your bill of materials.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {projects.map((project) => {
            const count = projectComponentCount(project);
            return (
              <Link key={project.id} href="/design-lab/d8/category">
                <BlueprintCard className="group h-full transition hover:-translate-y-0.5">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <span
                        className={`${mono} text-[11px] uppercase tracking-[0.24em]`}
                        style={{ color: ink.cyan }}
                      >
                        {project.code}
                      </span>
                      <span
                        className={`${mono} rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-[0.2em]`}
                        style={{
                          borderColor: ink.lineSoft,
                          color: ink.chalkFaint
                        }}
                      >
                        {project.stage}
                      </span>
                    </div>
                    <h3
                      className="mt-3 text-lg font-semibold tracking-tight"
                      style={{ color: ink.chalk }}
                    >
                      {project.name}
                    </h3>
                    <p
                      className="mt-1.5 text-sm leading-relaxed"
                      style={{ color: ink.chalkDim }}
                    >
                      {project.brief}
                    </p>
                    <div
                      className="mt-4 flex items-center justify-between border-t pt-3"
                      style={{ borderColor: ink.lineSoft }}
                    >
                      <Dimension value={`${count} parts`} hint={project.spec} />
                      <span
                        className={`${mono} inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] transition group-hover:gap-2.5`}
                        style={{ color: ink.cyan }}
                      >
                        Lay out build <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </BlueprintCard>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it works — confidence-building */}
      <section
        className="border-y"
        style={{ borderColor: ink.line, backgroundColor: ink.groundDeep }}
      >
        <div className="mx-auto max-w-6xl px-5 py-12">
          <DraftingMark label="Sheet 03 — Method" />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: PenTool,
                step: "01",
                t: "Open the drawing",
                d: "Choose your build. We expose the full component set, no SKU hunting."
              },
              {
                icon: Boxes,
                step: "02",
                t: "Spec each part",
                d: "Variants, finishes and stock counts shown in build context."
              },
              {
                icon: Wrench,
                step: "03",
                t: "Issue the BOM",
                d: "Your cart is a bill of materials — priced, tallied, ready to order."
              }
            ].map((row) => (
              <BlueprintCard key={row.step}>
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <span
                      className="grid h-9 w-9 place-items-center rounded-sm border"
                      style={{ borderColor: ink.cyanDeep, color: ink.cyan }}
                    >
                      <row.icon className="h-4 w-4" />
                    </span>
                    <span
                      className={`${mono} text-2xl font-semibold`}
                      style={{ color: ink.lineSoft }}
                    >
                      {row.step}
                    </span>
                  </div>
                  <p
                    className="mt-3 text-sm font-semibold"
                    style={{ color: ink.chalk }}
                  >
                    {row.t}
                  </p>
                  <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
                    {row.d}
                  </p>
                </div>
              </BlueprintCard>
            ))}
          </div>
        </div>
      </section>

      {/* Starter kit — real popular products framed as a kit */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex items-end justify-between">
          <div>
            <DraftingMark label="Sheet 04 — Pre-spec'd kit" />
            <h2
              className="mt-3 text-2xl font-semibold tracking-tight"
              style={{ color: ink.chalk }}
            >
              Gate Hardware Starter Kit
            </h2>
            <p className="mt-1 text-sm" style={{ color: ink.chalkDim }}>
              Four high-turn components bundled for a complete swing-gate build.
            </p>
          </div>
          <span
            className={`${mono} hidden rounded-sm border px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] sm:inline-flex`}
            style={{ borderColor: ink.lineSoft, color: ink.amber }}
          >
            Kit pricing · bundle to save
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {starterKit.map((product, index) => {
            const variant = product.variants[0];
            return (
              <Link key={product.id} href="/design-lab/d8/product">
                <BlueprintCard className="group h-full overflow-hidden transition hover:-translate-y-0.5">
                  <div
                    className="relative aspect-square"
                    style={{ backgroundColor: ink.panelSoft }}
                  >
                    <Image
                      alt={product.title}
                      src={
                        product.images[0]?.url ??
                        variant?.image ??
                        "/assets/logo.svg"
                      }
                      fill
                      quality={75}
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-contain p-6"
                    />
                    <span
                      className={`${mono} absolute left-2 top-2 text-[10px] uppercase tracking-[0.18em]`}
                      style={{ color: ink.cyan }}
                    >
                      Item {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div
                    className="border-t p-3"
                    style={{ borderColor: ink.lineSoft }}
                  >
                    <p
                      className="line-clamp-2 text-xs font-semibold leading-snug"
                      style={{ color: ink.chalk }}
                    >
                      {product.title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`${mono} text-sm font-semibold`}
                        style={{ color: ink.cyan }}
                      >
                        {usd(product.price)}
                      </span>
                      <span
                        className={`${mono} text-[10px] uppercase tracking-[0.16em]`}
                        style={{ color: ink.chalkFaint }}
                      >
                        {variant?.sku ?? product.id}
                      </span>
                    </div>
                  </div>
                </BlueprintCard>
              </Link>
            );
          })}
        </div>
        <div className="mt-5">
          <Link
            href="/design-lab/d8/cart"
            className={`${mono} inline-flex items-center gap-2 rounded-sm px-5 py-3 text-[12px] font-semibold uppercase tracking-[0.2em]`}
            style={{ backgroundColor: ink.cyan, color: ink.groundDeep }}
          >
            Add kit to bill of materials <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Fresh stock rail — real new arrivals */}
      <section
        className="border-t"
        style={{ borderColor: ink.line, backgroundColor: ink.groundDeep }}
      >
        <div className="mx-auto max-w-6xl px-5 py-12">
          <DraftingMark label="Sheet 05 — Recently stocked" />
          <h2
            className="mt-3 text-2xl font-semibold tracking-tight"
            style={{ color: ink.chalk }}
          >
            New on the shelf
          </h2>
          <div className="mt-6 grid gap-px overflow-hidden rounded-sm border sm:grid-cols-2 lg:grid-cols-3"
            style={{ borderColor: ink.line, backgroundColor: ink.line }}>
            {freshStock.map((product) => {
              const variant = product.variants[0];
              return (
                <Link
                  key={product.id}
                  href="/design-lab/d8/product"
                  className="flex items-center gap-3 p-3 transition"
                  style={{ backgroundColor: ink.panel }}
                >
                  <div
                    className="relative h-14 w-14 shrink-0 rounded-sm"
                    style={{ backgroundColor: ink.panelSoft }}
                  >
                    <Image
                      alt={product.title}
                      src={
                        product.images[0]?.url ??
                        variant?.image ??
                        "/assets/logo.svg"
                      }
                      fill
                      quality={75}
                      sizes="56px"
                      className="object-contain p-1.5"
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="line-clamp-1 text-xs font-semibold"
                      style={{ color: ink.chalk }}
                    >
                      {product.title}
                    </p>
                    <p
                      className={`${mono} mt-0.5 flex items-center gap-2 text-[11px]`}
                    >
                      <span style={{ color: ink.cyan }}>
                        {usd(product.price)}
                      </span>
                      <span
                        className="inline-flex items-center gap-1"
                        style={{ color: ink.chalkFaint }}
                      >
                        <CheckCircle2 className="h-3 w-3" /> In stock
                      </span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </D8Shell>
  );
}
