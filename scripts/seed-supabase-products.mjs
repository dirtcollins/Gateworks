import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import {
  DEFAULT_STEEL_CWT_PRICE,
  STEEL_DENSITY_LB_PER_IN3,
  calculateCwtPrice,
  calculateMetalWeight,
  parseLengthFt,
  parseTubeSize,
  parseWallThickness
} from "../src/lib/metalWeight.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false
  }
});

const raw = JSON.parse(
  await readFile(new URL("../data/national_hardware_gate_products.json", import.meta.url), "utf8")
);

const sourceProducts = raw.products;
const STEEL_CWT_PRICE = DEFAULT_STEEL_CWT_PRICE;
const groups = new Map();

for (const item of sourceProducts) {
  const key = item.product_grouping || item.slug;
  groups.set(key, [...(groups.get(key) || []), item]);
}

const selectedGroups = Array.from(groups.entries());

function inferColor(finish = "") {
  if (/black/i.test(finish)) return "Black";
  if (/white/i.test(finish)) return "White";
  if (/zinc|galvanized/i.test(finish)) return "Silver";
  if (/brass|gold/i.test(finish)) return "Brass";
  return finish || "Standard";
}

function inferMaterial(item) {
  const text = `${item.display_name} ${item.website_name} ${item.web_type}`.toLowerCase();
  if (text.includes("stainless")) return "Stainless Steel";
  if (text.includes("aluminum")) return "Aluminum";
  if (text.includes("vinyl")) return "Vinyl";
  if (text.includes("wood")) return "Wood";
  return "Steel";
}

function calculateTubingPrice(item) {
  if (!item.tube_shape || !item.tube_size || !item.wall_thickness) return null;
  const dimensions = parseTubeSize(item.tube_size);
  const wall = parseWallThickness(item.wall_thickness, item.gauge);
  if (!dimensions || !Number.isFinite(wall)) return null;

  const lengthFt = parseLengthFt(item.stock_length) || 20;
  let weight;

  try {
    weight = calculateMetalWeight(
      item.tube_shape === "square"
        ? {
            shape: "square-tubing",
            outsideSizeInches: dimensions.widthInches,
            wallThicknessInches: wall,
            lengthFt
          }
        : {
            shape: "rectangle-tubing",
            widthInches: dimensions.widthInches,
            heightInches: dimensions.heightInches,
            wallThicknessInches: wall,
            lengthFt
          }
    );
  } catch {
    return null;
  }

  const calculatedWeight = Math.ceil(weight.weightLbs * 100) / 100;
  const cwtPricing = calculateCwtPrice({
    weightLbs: calculatedWeight,
    cwtPrice: STEEL_CWT_PRICE
  });

  return {
    price: cwtPricing.roundedPrice,
    manual_price: null,
    calculated_price: Number(cwtPricing.calculatedPrice.toFixed(2)),
    rounded_price: cwtPricing.roundedPrice,
    final_price: cwtPricing.finalPrice,
    pricing_method: "cwt_calculated",
    width_in: dimensions.widthInches,
    height_in: dimensions.heightInches,
    wall_thickness_in: wall,
    length_ft: lengthFt,
    material_density_lb_per_in3: STEEL_DENSITY_LB_PER_IN3,
    steel_cwt_price: STEEL_CWT_PRICE,
    calculated_weight_lb: Number(calculatedWeight.toFixed(2))
  };
}

await supabase.from("admin_settings").upsert(
  {
    key: "steel_cwt_price",
    value: STEEL_CWT_PRICE,
    label: "Steel CWT price"
  },
  { onConflict: "key" }
);

for (const [, items] of selectedGroups) {
  const first = items[0];
  const brandName = first.brand || first.source || "Gateworks";
  const brandSlug = brandName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .upsert(
      {
        name: first.source_category,
        slug: first.source_category_slug
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (categoryError) throw categoryError;

  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .upsert(
      {
        name: brandName,
        slug: brandSlug || "gateworks"
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (brandError) throw brandError;

  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        category_id: category.id,
        brand_id: brand.id,
        title: first.display_name,
        slug: first.slug,
        description: `${first.website_name || first.display_name} for gates, fencing, and exterior construction work.`,
        details: [
          "Simple product configuration for Phase 1.",
          "Variant changes update price, image, SKU, and inventory."
        ],
        specifications: {
          brand: brandName,
          category: first.source_category,
          catalog_number: first.catalog_number,
          primary_sku: first.stock_number,
          source: first.source || "",
          source_url: first.url || "",
          price_label: first.price_label || "",
          collection: first.collection || "",
          tube_shape: first.tube_shape || "",
          tube_size: first.tube_size || "",
          wall_thickness: first.wall_thickness || "",
          gauge: first.gauge || "",
          stock_length: first.stock_length || "",
          typical_use: first.typical_use || ""
        },
        status: first.is_discontinued ? "archived" : "active",
        product_type: first.tube_shape ? "metal_supply" : "catalog",
        unit_of_measure: first.stock_length ? "length" : "each",
        gauge: first.gauge || null,
        material_type: first.tube_shape ? "Steel" : inferMaterial(first)
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (productError) throw productError;

  for (const item of items) {
    const tubingPrice = calculateTubingPrice(item);
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .upsert(
        {
          product_id: product.id,
          sku: item.stock_number,
          price: tubingPrice?.price ?? Number(item.price || 0),
          manual_price: tubingPrice?.manual_price ?? null,
          calculated_price: tubingPrice?.calculated_price ?? null,
          rounded_price: tubingPrice?.rounded_price ?? null,
          final_price: tubingPrice?.final_price ?? null,
          pricing_method: tubingPrice?.pricing_method ?? "manual",
          width_in: tubingPrice?.width_in ?? null,
          height_in: tubingPrice?.height_in ?? null,
          wall_thickness_in: tubingPrice?.wall_thickness_in ?? null,
          length_ft: tubingPrice?.length_ft ?? null,
          material_density_lb_per_in3: tubingPrice?.material_density_lb_per_in3 ?? null,
          steel_cwt_price: tubingPrice?.steel_cwt_price ?? null,
          calculated_weight_lb: tubingPrice?.calculated_weight_lb ?? null,
          inventory_status: "in_stock",
          inventory_quantity: 100,
          image_url: item.image,
          length: item.size || "Standard",
          material: inferMaterial(item),
          finish: item.finish || "Standard",
          color: inferColor(item.finish)
        },
        { onConflict: "sku" }
      )
      .select()
      .single();

    if (variantError) throw variantError;

    if (item.image) {
      const { error: imageError } = await supabase
        .from("product_images")
        .upsert(
          {
            product_id: product.id,
            variant_id: variant.id,
            url: item.image,
            alt: item.display_name,
            sort_order: 0
          },
          { onConflict: "product_id,url" }
        );

      if (imageError && imageError.code !== "23505") throw imageError;
    }
  }
}

console.log(`Seeded ${selectedGroups.length} product groups from ${sourceProducts.length} source rows.`);
