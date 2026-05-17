import type { Product, ProductVariant } from "@/lib/types";
import {
  DEFAULT_METAL_LENGTH_FT,
  DEFAULT_STEEL_CWT_PRICE,
  STEEL_DENSITY_LB_PER_IN3,
  calculateCwtPrice,
  calculateMetalWeight,
  parseLengthFt,
  parseTubeSize,
  parseWallThickness,
  toFiniteNumber
} from "@/src/lib/metalWeight";

export {
  DEFAULT_STEEL_CWT_PRICE,
  STEEL_DENSITY_LB_PER_IN3,
  calculateCwtPrice,
  calculateMetalWeight,
  parseLengthFt,
  parseTubeSize,
  parseWallThickness
};

export const DEFAULT_TUBING_LENGTH_FT = DEFAULT_METAL_LENGTH_FT;

const TUBING_CATEGORY_SLUGS = new Set([
  "square-steel-tubing",
  "rectangle-steel-tubing"
]);

type TubingInput = {
  width_in: number;
  height_in: number;
  wall_thickness_in: number;
  length_ft?: number;
  material_density_lb_per_in3?: number;
  steel_cwt_price?: number;
  manual_price?: number | null;
  pricing_method?: "manual" | "cwt_calculated";
};

export function isTubingProduct(product: Pick<Product, "category">) {
  return TUBING_CATEGORY_SLUGS.has(product.category.slug);
}

export function calculateTubingCwtPricing(input: TubingInput) {
  const length_ft = input.length_ft || DEFAULT_TUBING_LENGTH_FT;
  const material_density_lb_per_in3 =
    input.material_density_lb_per_in3 || STEEL_DENSITY_LB_PER_IN3;
  const steel_cwt_price = input.steel_cwt_price || DEFAULT_STEEL_CWT_PRICE;
  const pricing_method = input.pricing_method || "cwt_calculated";
  const manual_price = input.manual_price ?? null;

  const isSquareTubing = input.width_in === input.height_in;
  let weight;

  try {
    weight = calculateMetalWeight(
      isSquareTubing
        ? {
            shape: "square-tubing",
            outsideSizeInches: input.width_in,
            wallThicknessInches: input.wall_thickness_in,
            lengthFt: length_ft,
            densityLbPerIn3: material_density_lb_per_in3
          }
        : {
            shape: "rectangle-tubing",
            widthInches: input.width_in,
            heightInches: input.height_in,
            wallThicknessInches: input.wall_thickness_in,
            lengthFt: length_ft,
            densityLbPerIn3: material_density_lb_per_in3
          }
    );
  } catch {
    return null;
  }

  const calculated_weight_lb = Math.ceil(weight.weightLbs * 100) / 100;
  const cwtPricing = calculateCwtPrice({
    weightLbs: calculated_weight_lb,
    cwtPrice: steel_cwt_price
  });
  const final_price =
    pricing_method === "manual" && manual_price !== null
      ? manual_price
      : cwtPricing.finalPrice;

  return {
    width_in: input.width_in,
    height_in: input.height_in,
    wall_thickness_in: input.wall_thickness_in,
    length_ft,
    material_density_lb_per_in3,
    steel_cwt_price,
    calculated_weight_lb,
    calculated_price: Number(cwtPricing.calculatedPrice.toFixed(2)),
    rounded_price: cwtPricing.roundedPrice,
    manual_price,
    final_price,
    pricing_method
  };
}

export function applyTubingPricingToVariant(
  product: Product,
  variant: ProductVariant,
  steelCwtPrice = DEFAULT_STEEL_CWT_PRICE
): ProductVariant {
  if (!isTubingProduct(product)) {
    return variant;
  }

  const tubeSize =
    parseTubeSize(product.specifications["Tube Size"]) ||
    parseTubeSize(product.specifications.tube_size) ||
    parseTubeSize(product.title);
  const wallThickness =
    toFiniteNumber(variant.wall_thickness_in) ||
    parseWallThickness(variant.options.length) ||
    parseWallThickness(product.specifications["Wall Thickness"]) ||
    parseWallThickness(product.specifications.wall_thickness);

  if (!tubeSize || !wallThickness) {
    return {
      ...variant,
      steel_cwt_price: steelCwtPrice,
      material_density_lb_per_in3: STEEL_DENSITY_LB_PER_IN3,
      length_ft:
        toFiniteNumber(variant.length_ft) ||
        parseLengthFt(variant.options.length) ||
        parseLengthFt(product.specifications["Stock Length"]) ||
        DEFAULT_TUBING_LENGTH_FT,
      pricing_method: "cwt_calculated",
      manual_price: variant.manual_price ?? null
    };
  }

  const pricing = calculateTubingCwtPricing({
    width_in: toFiniteNumber(variant.width_in) || tubeSize.widthInches,
    height_in: toFiniteNumber(variant.height_in) || tubeSize.heightInches,
    wall_thickness_in: wallThickness,
    length_ft:
      toFiniteNumber(variant.length_ft) ||
      parseLengthFt(variant.options.length) ||
      parseLengthFt(product.specifications["Stock Length"]) ||
      DEFAULT_TUBING_LENGTH_FT,
    material_density_lb_per_in3:
      toFiniteNumber(variant.material_density_lb_per_in3) ||
      STEEL_DENSITY_LB_PER_IN3,
    steel_cwt_price:
      toFiniteNumber(variant.steel_cwt_price) || steelCwtPrice,
    manual_price: variant.manual_price ?? null,
    pricing_method: variant.pricing_method || "cwt_calculated"
  });

  if (!pricing) return variant;

  return {
    ...variant,
    ...pricing,
    price: pricing.final_price
  };
}

export function applyTubingPricing(product: Product, steelCwtPrice = DEFAULT_STEEL_CWT_PRICE): Product {
  if (!isTubingProduct(product)) {
    return product;
  }

  const variants = product.variants.map((variant) =>
    applyTubingPricingToVariant(product, variant, steelCwtPrice)
  );
  const firstPricedVariant = variants.find((variant) => variant.final_price !== undefined);
  const price = variants.reduce(
    (min, variant) => Math.min(min, variant.final_price ?? variant.price),
    Number.POSITIVE_INFINITY
  );

  return {
    ...product,
    variants,
    price,
    manual_price: firstPricedVariant?.manual_price ?? null,
    calculated_price: firstPricedVariant?.calculated_price,
    rounded_price: firstPricedVariant?.rounded_price,
    final_price: price,
    pricing_method: "cwt_calculated",
    steel_cwt_price: steelCwtPrice,
    calculated_weight_lb: firstPricedVariant?.calculated_weight_lb
  };
}

export function formatPricingMethod(method?: ProductVariant["pricing_method"]) {
  if (method === "manual") return "Manual";
  if (method === "cwt_calculated") return "CWT Calculated";
  return "Manual";
}
