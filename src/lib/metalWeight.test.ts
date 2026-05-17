import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCwtPrice,
  calculateMetalWeight,
  gaugeToWallThicknessInches,
  lengthFeetToInches
} from "./metalWeight.ts";

test("5/8 x 5/8 x 18ga x 24ft square tubing weighs roughly 9-12 lb", () => {
  const result = calculateMetalWeight({
    shape: "square-tubing",
    outsideSizeInches: 5 / 8,
    wallThicknessInches: gaugeToWallThicknessInches("18ga")!,
    lengthFt: 24
  });

  assert.ok(result.weightLbs >= 9 && result.weightLbs <= 12);
  assert.equal(result.lengthInches, lengthFeetToInches(24));
  assert.ok(result.innerWidthInches && result.innerWidthInches > 0);
});

test("1 x 1 x 16ga x 24ft square tubing weighs roughly 18-22 lb", () => {
  const result = calculateMetalWeight({
    shape: "square-tubing",
    outsideSizeInches: 1,
    wallThicknessInches: gaugeToWallThicknessInches("16ga")!,
    lengthFt: 24
  });

  assert.ok(result.weightLbs >= 18 && result.weightLbs <= 22);
});

test("2 x 2 x 11ga x 24ft square tubing weighs roughly 75-85 lb", () => {
  const result = calculateMetalWeight({
    shape: "square-tubing",
    outsideSizeInches: 2,
    wallThicknessInches: gaugeToWallThicknessInches("11ga")!,
    lengthFt: 24
  });

  assert.ok(result.weightLbs >= 73 && result.weightLbs <= 85);
});

test("5/8 x 5/8 solid square bar x 24ft is much heavier than 5/8 tubing", () => {
  const tubing = calculateMetalWeight({
    shape: "square-tubing",
    outsideSizeInches: 5 / 8,
    wallThicknessInches: gaugeToWallThicknessInches("18ga")!,
    lengthFt: 24
  });
  const solid = calculateMetalWeight({
    shape: "solid-square-bar",
    sizeInches: 5 / 8,
    lengthFt: 24
  });

  assert.ok(solid.weightLbs > tubing.weightLbs * 3);
});

test("tubing rejects zero or negative inner dimensions", () => {
  assert.throws(
    () =>
      calculateMetalWeight({
        shape: "square-tubing",
        outsideSizeInches: 1,
        wallThicknessInches: 0.5,
        lengthFt: 20
      }),
    /inner dimension/
  );
});

test("CWT pricing uses weight divided by 100 times CWT price", () => {
  const result = calculateCwtPrice({ weightLbs: 10, cwtPrice: 105 });

  assert.equal(result.calculatedPrice, 10.5);
  assert.equal(result.finalPrice, 11);
});
