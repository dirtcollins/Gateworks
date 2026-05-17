export const STEEL_DENSITY_LB_PER_IN3 = 0.2836;
export const DEFAULT_STEEL_CWT_PRICE = 105;
export const DEFAULT_METAL_LENGTH_FT = 20;

export const GAUGE_WALL_THICKNESS_IN = {
  "18ga": 0.049,
  "18 gauge": 0.049,
  "16ga": 0.06,
  "16 gauge": 0.06,
  "14ga": 0.075,
  "14 gauge": 0.075,
  "11ga": 0.12,
  "11 gauge": 0.12
} as const;

type BaseMetalInput = {
  lengthFt?: number;
  lengthInches?: number;
  densityLbPerIn3?: number;
};

export type SquareTubingWeightInput = BaseMetalInput & {
  shape: "square-tubing";
  outsideSizeInches: number;
  wallThicknessInches: number;
};

export type RectangleTubingWeightInput = BaseMetalInput & {
  shape: "rectangle-tubing";
  widthInches: number;
  heightInches: number;
  wallThicknessInches: number;
};

export type SolidSquareBarWeightInput = BaseMetalInput & {
  shape: "solid-square-bar";
  sizeInches: number;
};

export type FlatBarWeightInput = BaseMetalInput & {
  shape: "flat-bar" | "plate";
  widthInches: number;
  thicknessInches: number;
};

export type RoundBarWeightInput = BaseMetalInput & {
  shape: "round-bar";
  diameterInches: number;
};

export type SheetMetalWeightInput = {
  shape: "sheet-metal";
  widthInches: number;
  lengthInches: number;
  thicknessInches: number;
  densityLbPerIn3?: number;
};

export type MetalWeightInput =
  | SquareTubingWeightInput
  | RectangleTubingWeightInput
  | SolidSquareBarWeightInput
  | FlatBarWeightInput
  | RoundBarWeightInput
  | SheetMetalWeightInput;

export type MetalWeightResult = {
  shape: MetalWeightInput["shape"];
  areaIn2?: number;
  volumeIn3: number;
  weightLbs: number;
  densityLbPerIn3: number;
  lengthInches?: number;
  innerWidthInches?: number;
  innerHeightInches?: number;
};

export type CwtPricingInput = {
  weightLbs: number;
  cwtPrice?: number;
};

export type CwtPricingResult = {
  weightLbs: number;
  cwtPrice: number;
  calculatedPrice: number;
  roundedPrice: number;
  finalPrice: number;
};

export function toFiniteNumber(value: unknown) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function requirePositiveNumber(value: number | undefined, label: string) {
  if (value === undefined || value <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }

  return value;
}

export function lengthFeetToInches(lengthFt: number) {
  return requirePositiveNumber(lengthFt, "Length in feet") * 12;
}

export function resolveLengthInches(input: BaseMetalInput) {
  if (input.lengthInches !== undefined) {
    return requirePositiveNumber(input.lengthInches, "Length in inches");
  }

  return lengthFeetToInches(input.lengthFt ?? DEFAULT_METAL_LENGTH_FT);
}

export function parseFractionalInches(value: string) {
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

  const widthInches = parseFractionalInches(match[1]);
  const heightInches = parseFractionalInches(match[2]);

  if (!widthInches || !heightInches) return null;

  return {
    widthInches,
    heightInches
  };
}

export function normalizeGauge(value?: string) {
  return value?.toLowerCase().replace(/\s+/g, " ").trim();
}

export function gaugeToWallThicknessInches(value?: string) {
  const normalized = normalizeGauge(value);
  if (!normalized) return undefined;

  if (/\b18\s*(?:ga|gauge)\b/.test(normalized)) return GAUGE_WALL_THICKNESS_IN["18ga"];
  if (/\b16\s*(?:ga|gauge)\b/.test(normalized)) return GAUGE_WALL_THICKNESS_IN["16ga"];
  if (/\b14\s*(?:ga|gauge)\b/.test(normalized)) return GAUGE_WALL_THICKNESS_IN["14ga"];
  if (/\b11\s*(?:ga|gauge)\b/.test(normalized)) return GAUGE_WALL_THICKNESS_IN["11ga"];

  return GAUGE_WALL_THICKNESS_IN[normalized as keyof typeof GAUGE_WALL_THICKNESS_IN];
}

export function parseWallThickness(value?: string, gauge?: string) {
  const gaugeThickness = gaugeToWallThicknessInches(gauge || value);
  if (gaugeThickness) return gaugeThickness;

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

function makeResult(
  input: MetalWeightInput,
  volumeIn3: number,
  extra: Omit<MetalWeightResult, "shape" | "volumeIn3" | "weightLbs" | "densityLbPerIn3">
): MetalWeightResult {
  const densityLbPerIn3 = input.densityLbPerIn3 ?? STEEL_DENSITY_LB_PER_IN3;

  return {
    shape: input.shape,
    ...extra,
    volumeIn3,
    densityLbPerIn3,
    weightLbs: volumeIn3 * densityLbPerIn3
  };
}

export function calculateMetalWeight(input: MetalWeightInput): MetalWeightResult {
  if (input.shape === "sheet-metal") {
    const width = requirePositiveNumber(input.widthInches, "Sheet width");
    const length = requirePositiveNumber(input.lengthInches, "Sheet length");
    const thickness = requirePositiveNumber(input.thicknessInches, "Sheet thickness");
    return makeResult(input, width * length * thickness, {
      lengthInches: length
    });
  }

  const lengthInches = resolveLengthInches(input);

  if (input.shape === "square-tubing") {
    const outer = requirePositiveNumber(input.outsideSizeInches, "Outside size");
    const wall = requirePositiveNumber(input.wallThicknessInches, "Wall thickness");
    const inner = outer - 2 * wall;

    if (inner <= 0) {
      throw new Error("Square tubing inner dimension must be greater than zero.");
    }

    const areaIn2 = outer ** 2 - inner ** 2;
    return makeResult(input, areaIn2 * lengthInches, {
      areaIn2,
      lengthInches,
      innerWidthInches: inner,
      innerHeightInches: inner
    });
  }

  if (input.shape === "rectangle-tubing") {
    const width = requirePositiveNumber(input.widthInches, "Tube width");
    const height = requirePositiveNumber(input.heightInches, "Tube height");
    const wall = requirePositiveNumber(input.wallThicknessInches, "Wall thickness");
    const innerWidth = width - 2 * wall;
    const innerHeight = height - 2 * wall;

    if (innerWidth <= 0 || innerHeight <= 0) {
      throw new Error("Rectangle tubing inner dimensions must be greater than zero.");
    }

    const areaIn2 = width * height - innerWidth * innerHeight;
    return makeResult(input, areaIn2 * lengthInches, {
      areaIn2,
      lengthInches,
      innerWidthInches: innerWidth,
      innerHeightInches: innerHeight
    });
  }

  if (input.shape === "solid-square-bar") {
    const size = requirePositiveNumber(input.sizeInches, "Square bar size");
    const areaIn2 = size * size;
    return makeResult(input, areaIn2 * lengthInches, { areaIn2, lengthInches });
  }

  if (input.shape === "flat-bar" || input.shape === "plate") {
    const width = requirePositiveNumber(input.widthInches, "Bar width");
    const thickness = requirePositiveNumber(input.thicknessInches, "Bar thickness");
    const areaIn2 = width * thickness;
    return makeResult(input, areaIn2 * lengthInches, { areaIn2, lengthInches });
  }

  if (input.shape === "round-bar") {
    const radius = requirePositiveNumber(input.diameterInches, "Round bar diameter") / 2;
    const areaIn2 = Math.PI * radius ** 2;
    return makeResult(input, areaIn2 * lengthInches, { areaIn2, lengthInches });
  }

  throw new Error("Unsupported metal shape.");
}

export function calculateCwtPrice(input: CwtPricingInput): CwtPricingResult {
  const weightLbs = requirePositiveNumber(input.weightLbs, "Weight");
  const cwtPrice = requirePositiveNumber(
    input.cwtPrice ?? DEFAULT_STEEL_CWT_PRICE,
    "CWT price"
  );
  const calculatedPrice = (weightLbs / 100) * cwtPrice;
  const roundedPrice = Math.ceil(calculatedPrice);

  return {
    weightLbs,
    cwtPrice,
    calculatedPrice,
    roundedPrice,
    finalPrice: roundedPrice
  };
}
