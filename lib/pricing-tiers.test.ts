import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { resolveLineDiscountPct, applyTierDiscount } from "./pricing-tiers.ts";
import type { PriceTierRule } from "./pricing-tiers.ts";

const rules: PriceTierRule[] = [
  { tier: "gold", categorySlug: null, discountPct: 10, minQuantity: 1 },
  { tier: "gold", categorySlug: "steel", discountPct: 20, minQuantity: 5 },
  { tier: "gold", categorySlug: "steel", discountPct: 30, minQuantity: 10 },
  { tier: "silver", categorySlug: null, discountPct: 5, minQuantity: 1 },
  { tier: "silver", categorySlug: "aluminum", discountPct: 15, minQuantity: 3 },
];

describe("resolveLineDiscountPct", () => {
  test("returns the best (highest) discount among matching rules", () => {
    // gold + steel + qty 10: matches category-null (10%), specific at 5 (20%), specific at 10 (30%)
    const pct = resolveLineDiscountPct(rules, { tier: "gold", categorySlug: "steel", quantity: 10 });
    assert.equal(pct, 30);
  });

  test("tier must match — wrong tier returns 0", () => {
    const pct = resolveLineDiscountPct(rules, { tier: "bronze", categorySlug: "steel", quantity: 10 });
    assert.equal(pct, 0);
  });

  test("quantity must meet minQuantity — just under threshold returns lower discount", () => {
    // qty 4: category-null (10%) matches; specific steel at 5 does NOT (qty < 5)
    const pct = resolveLineDiscountPct(rules, { tier: "gold", categorySlug: "steel", quantity: 4 });
    assert.equal(pct, 10);
  });

  test("category-null rules apply to any category", () => {
    const pct = resolveLineDiscountPct(rules, { tier: "gold", categorySlug: "lumber", quantity: 1 });
    assert.equal(pct, 10);
  });

  test("category-null rules apply when categorySlug is null", () => {
    const pct = resolveLineDiscountPct(rules, { tier: "gold", categorySlug: null, quantity: 1 });
    assert.equal(pct, 10);
  });

  test("category-specific rules only match that category", () => {
    // silver + aluminum at qty 3 should get 15%, not applied to 'steel'
    const pct = resolveLineDiscountPct(rules, { tier: "silver", categorySlug: "steel", quantity: 3 });
    assert.equal(pct, 5); // only the category-null silver rule matches
  });

  test("no matching rules returns 0", () => {
    const pct = resolveLineDiscountPct([], { tier: "gold", categorySlug: "steel", quantity: 10 });
    assert.equal(pct, 0);
  });

  test("exactly at minQuantity threshold qualifies", () => {
    const pct = resolveLineDiscountPct(rules, { tier: "gold", categorySlug: "steel", quantity: 5 });
    assert.equal(pct, 20);
  });
});

describe("applyTierDiscount", () => {
  test("0% discount returns original price", () => {
    assert.equal(applyTierDiscount(100, 0), 100);
  });

  test("negative discount returns original price", () => {
    assert.equal(applyTierDiscount(100, -5), 100);
  });

  test("applies positive discount percentage correctly", () => {
    assert.equal(applyTierDiscount(100, 10), 90);
  });

  test("rounds to 2 decimal places", () => {
    // 33.33 * (1 - 10/100) = 29.997 -> 30.00
    assert.equal(applyTierDiscount(33.33, 10), 30);
  });

  test("100% discount returns 0", () => {
    assert.equal(applyTierDiscount(100, 100), 0);
  });

  test("never goes below 0", () => {
    assert.equal(applyTierDiscount(10, 200), 0);
  });
});
