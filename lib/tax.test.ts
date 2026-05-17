import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { calculateTax, DEFAULT_TAX_RATE } from "./tax.ts";

describe("calculateTax", () => {
  test("default rate is 0.0825 when env var is not set", () => {
    assert.equal(DEFAULT_TAX_RATE, 0.0825);
  });

  test("applies default rate to a taxable amount", () => {
    const result = calculateTax(100);
    assert.equal(result, Number((100 * DEFAULT_TAX_RATE).toFixed(2)));
  });

  test("applies custom rate when provided", () => {
    const result = calculateTax(100, { rate: 0.1 });
    assert.equal(result, 10);
  });

  test("taxExempt returns 0 regardless of amount", () => {
    assert.equal(calculateTax(500, { taxExempt: true }), 0);
  });

  test("taxExempt with custom rate still returns 0", () => {
    assert.equal(calculateTax(200, { taxExempt: true, rate: 0.15 }), 0);
  });

  test("rounds result to 2 decimal places", () => {
    // 33.33 * 0.0825 = 2.749725 -> 2.75
    const result = calculateTax(33.33, { rate: 0.0825 });
    assert.equal(result, 2.75);
  });

  test("zero amount returns 0", () => {
    assert.equal(calculateTax(0), 0);
  });

  test("returns a number not a string", () => {
    assert.equal(typeof calculateTax(100), "number");
  });
});
