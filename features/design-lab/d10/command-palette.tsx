"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  categories,
  popularProducts,
  products,
  searchProducts
} from "@/features/design-lab/live-data";
import { Kbd, SIGNAL, formatUsd } from "./kit";

// The Signal centerpiece: a keyboard-first command palette running on the
// REAL catalog. Instant client-side filtering across products, SKUs and
// categories with intelligent suggestions when the query is empty.

type Result =
  | { kind: "product"; id: string; title: string; sub: string; price: number; image: string }
  | { kind: "category"; id: string; title: string; sub: string };

function buildResults(query: string): Result[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    // Empty state — surface "smart" suggestions from popular real products.
    return popularProducts.slice(0, 6).map((product) => ({
      kind: "product" as const,
      id: product.id,
      title: product.title,
      sub: `${product.category.name} · ${product.variants[0]?.sku ?? "—"}`,
      price: product.price,
      image: product.images[0]?.url ?? product.variants[0]?.image ?? "/assets/logo.svg"
    }));
  }

  const catHits: Result[] = categories
    .filter((category) => category.name.toLowerCase().includes(q))
    .slice(0, 3)
    .map((category) => ({
      kind: "category" as const,
      id: category.slug,
      title: category.name,
      sub: `${searchProducts("", category.slug).length} products in catalog`
    }));

  const productHits: Result[] = searchProducts(query)
    .slice(0, 7)
    .map((product) => ({
      kind: "product" as const,
      id: product.id,
      title: product.title,
      sub: `${product.category.name} · ${product.variants[0]?.sku ?? "—"}`,
      price: product.price,
      image: product.images[0]?.url ?? product.variants[0]?.image ?? "/assets/logo.svg"
    }));

  return [...catHits, ...productHits];
}

function resultHref(result: Result): string {
  return result.kind === "category"
    ? "/design-lab/d10/category"
    : "/design-lab/d10/product";
}

const QUICK = ["latch", "hinge", "steel tubing", "gate", "milwaukee"];

export function CommandPalette({
  variant = "inline"
}: {
  variant?: "inline" | "modal";
}) {
  const [open, setOpen] = useState(variant === "inline");
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo(() => buildResults(query), [query]);

  useEffect(() => {
    setCursor(0);
  }, [query]);

  // ⌘K / Ctrl+K opens the modal palette anywhere.
  useEffect(() => {
    if (variant !== "modal") return;
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 30);
      return () => window.clearTimeout(id);
    }
    return undefined;
  }, [open]);

  function onListKey(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => Math.min(results.length - 1, value + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => Math.max(0, value - 1));
    }
  }

  const panel = (
    <div
      className="overflow-hidden rounded-[14px] border shadow-[0_24px_60px_-24px_rgba(15,17,23,0.35)]"
      style={{ borderColor: SIGNAL.line, background: SIGNAL.surface }}
    >
      {/* search input */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3.5"
        style={{ borderColor: SIGNAL.line }}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          fill="none"
          stroke={SIGNAL.accent}
          strokeWidth={2.4}
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onListKey}
          placeholder="Search 2,200+ parts, SKUs, categories…"
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9aa0ac]"
          style={{ color: SIGNAL.ink }}
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-[11px] font-medium"
            style={{ color: SIGNAL.sub }}
          >
            Clear
          </button>
        ) : (
          <Kbd>Esc</Kbd>
        )}
      </div>

      {/* results */}
      <div className="max-h-[340px] overflow-y-auto p-1.5">
        <p
          className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: SIGNAL.sub }}
        >
          {query ? `${results.length} matches` : "Suggested for your recent jobs"}
        </p>
        {results.length === 0 ? (
          <div className="px-3 py-8 text-center text-[13px]" style={{ color: SIGNAL.sub }}>
            No catalog match for &ldquo;{query}&rdquo;.
          </div>
        ) : (
          results.map((result, index) => (
            <Link
              key={`${result.kind}-${result.id}`}
              href={resultHref(result)}
              onMouseEnter={() => setCursor(index)}
              className="flex items-center gap-3 rounded-[9px] px-2.5 py-2 transition-colors"
              style={{
                background: cursor === index ? SIGNAL.accentSoft : "transparent"
              }}
            >
              {result.kind === "product" ? (
                <span
                  className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[7px]"
                  style={{ background: SIGNAL.canvas }}
                >
                  <Image
                    src={result.image}
                    alt={result.title}
                    fill
                    quality={60}
                    sizes="36px"
                    className="object-contain p-1"
                  />
                </span>
              ) : (
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-[7px] text-[11px] font-bold"
                  style={{ background: SIGNAL.accentSoft, color: SIGNAL.accent }}
                >
                  ▦
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-[13px] font-medium"
                  style={{ color: SIGNAL.ink }}
                >
                  {result.title}
                </span>
                <span
                  className="block truncate text-[11px]"
                  style={{ color: SIGNAL.sub }}
                >
                  {result.sub}
                </span>
              </span>
              {result.kind === "product" ? (
                <span
                  className="shrink-0 text-[12px] font-semibold tabular-nums"
                  style={{ color: SIGNAL.ink }}
                >
                  {formatUsd(result.price)}
                </span>
              ) : (
                <span className="shrink-0 text-[11px]" style={{ color: SIGNAL.accent }}>
                  Open ↵
                </span>
              )}
            </Link>
          ))
        )}
      </div>

      {/* footer hints */}
      <div
        className="flex items-center justify-between gap-3 border-t px-3.5 py-2"
        style={{ borderColor: SIGNAL.line, background: SIGNAL.canvas }}
      >
        <span className="flex items-center gap-1.5 text-[10px]" style={{ color: SIGNAL.sub }}>
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          navigate
          <Kbd>↵</Kbd>
          open
        </span>
        <span className="text-[10px]" style={{ color: SIGNAL.sub }}>
          {products.length} live products · instant index
        </span>
      </div>
    </div>
  );

  if (variant === "inline") {
    return (
      <div>
        {panel}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium" style={{ color: SIGNAL.sub }}>
            Try
          </span>
          {QUICK.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQuery(term)}
              className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors hover:bg-white"
              style={{ borderColor: SIGNAL.line, color: SIGNAL.sub }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // modal variant
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-[9px] border px-3 py-2 text-[12px] font-medium transition-colors hover:bg-white"
        style={{ borderColor: SIGNAL.line, color: SIGNAL.sub }}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" />
        </svg>
        Quick search
        <span className="ml-auto">
          <Kbd>⌘K</Kbd>
        </span>
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
          style={{ background: "rgba(15,17,23,0.4)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {panel}
          </div>
        </div>
      ) : null}
    </>
  );
}
