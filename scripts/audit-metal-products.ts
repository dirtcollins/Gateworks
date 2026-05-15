import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  DEFAULT_STEEL_CWT_PRICE,
  calculateCwtPrice,
  calculateMetalWeight,
  parseLengthFt,
  parseTubeSize,
  parseWallThickness
} from "../src/lib/metalWeight.ts";

type RawMetalProduct = {
  stock_number?: string;
  source_category_slug?: string;
  tube_shape?: string;
  tube_size?: string;
  wall_thickness?: string;
  gauge?: string;
  stock_length?: string;
};

const catalog = JSON.parse(
  await readFile(new URL("../data/national_hardware_gate_products.json", import.meta.url), "utf8")
) as { products: RawMetalProduct[] };

const metalRows = catalog.products.filter((item) => item.tube_shape);
let checkedRows = 0;

for (const item of metalRows) {
  const dimensions = parseTubeSize(item.tube_size);
  const wallThicknessInches = parseWallThickness(item.wall_thickness, item.gauge);
  const lengthFt = parseLengthFt(item.stock_length) || 20;

  assert.ok(dimensions, `Missing tube dimensions for ${item.stock_number}`);
  assert.ok(wallThicknessInches, `Missing wall thickness for ${item.stock_number}`);

  const weight = calculateMetalWeight(
    item.tube_shape === "square"
      ? {
          shape: "square-tubing",
          outsideSizeInches: dimensions.widthInches,
          wallThicknessInches,
          lengthFt
        }
      : {
          shape: "rectangle-tubing",
          widthInches: dimensions.widthInches,
          heightInches: dimensions.heightInches,
          wallThicknessInches,
          lengthFt
        }
  );
  const calculatedWeightLbs = Math.ceil(weight.weightLbs * 100) / 100;
  const pricing = calculateCwtPrice({
    weightLbs: calculatedWeightLbs,
    cwtPrice: DEFAULT_STEEL_CWT_PRICE
  });

  assert.ok(weight.innerWidthInches && weight.innerWidthInches > 0);
  assert.ok(weight.innerHeightInches && weight.innerHeightInches > 0);
  assert.ok(pricing.calculatedPrice > 0);
  checkedRows += 1;
}

assert.equal(checkedRows, metalRows.length);
console.log(`Audited ${checkedRows} metal products with centralized weight and CWT pricing.`);
