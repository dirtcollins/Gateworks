// Wayfinder — search results / catalog browse. Real query + category
// filtering over @/lib/catalog (searchProducts), an aisle-coded department
// rail, sort controls, results grid, and an empty state. The query and
// category are reflected in the URL so links and the header search work.
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { searchProducts } from "@/lib/catalog";
import { departments } from "./data";
import { ProductGrid } from "./product-card";
import { Eyebrow, Ico, Mono, wf } from "./kit";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price ↑" },
  { value: "price-high", label: "Price ↓" },
  { value: "title", label: "A–Z" }
] as const;

type SortValue = (typeof SORTS)[number]["value"];

export function WayfinderSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? "all";

  const [draft, setDraft] = useState(query);
  const [sort, setSort] = useState<SortValue>("featured");

  const depts = departments();

  // Real catalog search — title / category / SKU match plus category filter.
  const results = useMemo(() => {
    const base = searchProducts(query, category);
    const list = [...base];
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    else if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    else if (sort === "title") list.sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [query, category, sort]);

  // Push a new URL — keeps q / category in sync so the page is shareable.
  function navigate(nextQuery: string, nextCategory: string) {
    const search = new URLSearchParams();
    if (nextQuery.trim()) search.set("q", nextQuery.trim());
    if (nextCategory !== "all") search.set("category", nextCategory);
    const qs = search.toString();
    router.push(qs ? `/wayfinder/search?${qs}` : "/wayfinder/search");
  }

  const activeCategory = depts.find((dept) => dept.slug === category);
  const heading = activeCategory
    ? activeCategory.name
    : query
      ? `Results for “${query}”`
      : "Full catalog";

  return (
    <>
      {/* Page header + search */}
      <div
        style={{
          padding: "22px 24px 14px",
          borderBottom: `1px solid ${wf.rail}`,
          background: wf.paper
        }}
      >
        <Eyebrow style={{ marginBottom: 6 }}>Gateworks Supply · Catalog</Eyebrow>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 900,
            letterSpacing: "-0.01em",
            color: wf.ink
          }}
        >
          {heading}
        </h1>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            navigate(draft, category);
          }}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            border: `1px solid ${wf.rail}`,
            background: "#fff",
            height: 46,
            maxWidth: 560,
            marginTop: 12
          }}
        >
          <label
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              alignItems: "center",
              padding: "0 12px"
            }}
          >
            <Ico.search size={18} />
            <input
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search hardware, tube, fence, welding…"
              style={{
                border: "none",
                background: "transparent",
                padding: "0 12px",
                height: "100%",
                fontSize: 14,
                fontWeight: 600,
                outline: "none"
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              padding: "0 22px",
              background: wf.ink,
              color: "#fff",
              fontWeight: 900,
              fontSize: 12,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "none",
              cursor: "pointer"
            }}
          >
            Search
          </button>
        </form>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 24,
          padding: "20px 24px 48px"
        }}
      >
        {/* Department filter rail */}
        <aside>
          <Eyebrow style={{ marginBottom: 8 }}>Departments · aisle codes</Eyebrow>
          <div style={{ background: "#fff", border: `1px solid ${wf.rail}` }}>
            <button
              type="button"
              onClick={() => navigate(query, "all")}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "10px 14px",
                fontSize: 13,
                fontWeight: category === "all" ? 800 : 600,
                color: category === "all" ? wf.ink : wf.steel,
                background: category === "all" ? wf.paper : "transparent",
                border: "none",
                borderBottom: `1px solid ${wf.hairline}`,
                cursor: "pointer"
              }}
            >
              All departments
            </button>
            {depts.map((dept) => {
              const on = dept.slug === category;
              return (
                <button
                  key={dept.slug}
                  type="button"
                  onClick={() => navigate(query, dept.slug)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: on ? 800 : 600,
                    color: on ? wf.ink : wf.steel,
                    background: on ? wf.paper : "transparent",
                    border: "none",
                    borderBottom: `1px solid ${wf.hairline}`,
                    cursor: "pointer"
                  }}
                >
                  <span>{dept.name}</span>
                  <Mono style={{ fontSize: 10, color: wf.muted }}>
                    A{dept.aisle} · {dept.count}
                  </Mono>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Results */}
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${wf.rail}`,
              marginBottom: 16
            }}
          >
            <Mono style={{ fontSize: 12, color: wf.steel }}>
              {results.length} result{results.length === 1 ? "" : "s"}
            </Mono>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortValue)}
              aria-label="Sort results"
              style={{
                height: 36,
                border: `1px solid ${wf.rail}`,
                background: "#fff",
                padding: "0 12px",
                fontSize: 13,
                fontWeight: 600,
                color: wf.ink,
                width: 170
              }}
            >
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort: {option.label}
                </option>
              ))}
            </select>
          </div>

          {results.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: `1px solid ${wf.rail}`,
                padding: "56px 24px",
                textAlign: "center",
                display: "grid",
                gap: 10,
                placeItems: "center"
              }}
            >
              <Ico.search size={28} />
              <div style={{ fontSize: 16, fontWeight: 900, color: wf.ink }}>
                Nothing in this aisle
              </div>
              <Mono style={{ fontSize: 12, color: wf.muted, maxWidth: 360 }}>
                No products matched
                {query ? ` “${query}”` : ""}
                {activeCategory ? ` in ${activeCategory.name}` : ""}. Try a
                different term or clear the department filter.
              </Mono>
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  router.push("/wayfinder/search");
                }}
                style={{
                  marginTop: 4,
                  height: 38,
                  padding: "0 16px",
                  background: wf.ink,
                  color: "#fff",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 900,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}
              >
                Clear search
              </button>
            </div>
          ) : (
            <ProductGrid products={results} />
          )}
        </div>
      </div>
    </>
  );
}
