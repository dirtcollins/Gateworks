import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { getOrderStatusTone, getPaymentStatusTone } from "./order-status.ts";

describe("getOrderStatusTone", () => {
  test("draft returns neutral", () => {
    assert.equal(getOrderStatusTone("draft"), "neutral");
  });

  test("submitted returns warning", () => {
    assert.equal(getOrderStatusTone("submitted"), "warning");
  });

  test("confirmed returns info", () => {
    assert.equal(getOrderStatusTone("confirmed"), "info");
  });

  test("picking returns info", () => {
    assert.equal(getOrderStatusTone("picking"), "info");
  });

  test("out_for_delivery returns info", () => {
    assert.equal(getOrderStatusTone("out_for_delivery"), "info");
  });

  test("ready_for_pickup returns success", () => {
    assert.equal(getOrderStatusTone("ready_for_pickup"), "success");
  });

  test("completed returns success", () => {
    assert.equal(getOrderStatusTone("completed"), "success");
  });

  test("cancelled returns danger", () => {
    assert.equal(getOrderStatusTone("cancelled"), "danger");
  });
});

describe("getPaymentStatusTone", () => {
  test("unpaid returns danger", () => {
    assert.equal(getPaymentStatusTone("unpaid"), "danger");
  });

  test("partial returns warning", () => {
    assert.equal(getPaymentStatusTone("partial"), "warning");
  });

  test("paid returns success", () => {
    assert.equal(getPaymentStatusTone("paid"), "success");
  });

  test("overpaid returns info", () => {
    assert.equal(getPaymentStatusTone("overpaid"), "info");
  });

  test("refunded returns neutral", () => {
    assert.equal(getPaymentStatusTone("refunded"), "neutral");
  });

  test("failed returns danger", () => {
    assert.equal(getPaymentStatusTone("failed"), "danger");
  });
});
