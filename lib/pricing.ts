import type { Product, ProductVariant } from "@/lib/types";

export const DEFAULT_STEEL_CWT_PRICE = 105;
export const STEEL_DENSITY_LB_PER_IN3 = 0.2836;
export const DEFAULT_TUBING_LENGTH_FT = 20;

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

function toFiniteNumber(value: unknown) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function parseFractionalInches(value: string) {
  const normalized = value.trim().replace(/"/g, "");
  const mixedMatch = normalized.match(/^(\d+)-(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const [, whole, numerator, denominator] = mixedMatch;
    return Number(whole) + Number(numerator) / Number(denominator);
  }

  const fractionMatch = normalized.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const [, numerator, denominator] = fractionMatch;
    return Number(numerator) / Number(denominator);
  }

  const decimal = Number(normalized);
  return Number.isFinite(decimal) ? decimal : undefined;
}

export function parseTubeSize(value?: string) {
  if (!value) return null;

  const match = value.match(
    /(\d+(?:-\d+\/\d+|\.\d+)?|\d+\/\d+)\s*"?\s*x\s*(\d+(?:-\d+\/\d+|\.\d+)?|\d+\/\d+)/i
  );

  if (!match) return null;

  const width = parseFractionalInches(match[1]);
  const height = parseFractionalInches(match[2]);

  if (!width || !height) return null;

  return {
    width_in: width,
    height_in: height
  };
}

export function parseWallThickness(value?: string) {
  if (!value) return undefined;

  const match = value.match(/(?:^|[^\d])(\.\d+|\d+\.\d+|\d+\/\d+)(?=\s*(?:"|in|wall|\)|$))/i);
  if (!match) return undefined;

  return parseFractionalInches(match[1]);
}

export function parseLengthFt(value?: string) {
  if (!value) return undefined;

  const match = value.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|')/i);
  if (!match) return undefined;

  const length = Number(match[1]);
  return Number.isFinite(length) ? length : undefined;
}

export function calculateTubingCwtPricing(input: TubingInput) {
  const length_ft = input.length_ft || DEFAULT_TUBING_LENGTH_FT;
  const material_density_lb_per_in3 =
    input.material_density_lb_per_in3 || STEEL_DENSITY_LB_PER_IN3;
  const steel_cwt_price = input.steel_cwt_price || DEFAULT_STEEL_CWT_PRICE;
  const pricing_method = input.pricing_method || "cwt_calculated";
  const manual_price = input.manual_price ?? null;

  const inner_width = input.width_in - 2 * input.wall_thickness_in;
  const inner_height = input.height_in - 2 * input.wall_thickness_in;

  if (inner_width <= 0 || inner_height <= 0) {
    return null;
  }

  const outer_area = input.width_in * input.height_in;
  const inner_area = inner_width * inner_height;
  const steel_area = outer_area - inner_area;
  const length_in = length_ft * 12;
  const raw_weight_lb = steel_area * length_in * material_density_lb_per_in3;
  const calculated_weight_lb = Math.ceil(raw_weight_lb * 100) / 100;
  const calculated_price = (calculated_weight_lb / 100) * steel_cwt_price;
  const rounded_price = Math.ceil(calculated_price);
  const final_price =
    pricing_method === "manual" && manual_price !== null
      ? manual_price
      : rounded_price;

  return {
    width_in: input.width_in,
    height_in: input.height_in,
    wall_thickness_in: input.wall_thickness_in,
    length_ft,
    material_density_lb_per_in3,
    steel_cwt_price,
    calculated_weight_lb,
    calculated_price: Number(calculated_price.toFixed(2)),
    rounded_price,
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
    width_in: toFiniteNumber(variant.width_in) || tubeSize.width_in,
    height_in: toFiniteNumber(variant.height_in) || tubeSize.height_in,
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
  const price = Math.min(...variants.map((variant) => variant.final_price ?? variant.price));

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
