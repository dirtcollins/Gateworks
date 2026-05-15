import type { Product, ProductImage, ProductVariant } from "@/lib/types";
import { DEFAULT_STEEL_CWT_PRICE, applyTubingPricing } from "@/lib/pricing";
import { getSupabaseClient } from "@/lib/supabase";

function shouldRequireSupabase() {
  return process.env.NODE_ENV === "production";
}

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  details: string[] | null;
  specifications: Record<string, string> | null;
  categories:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | Array<{
        id: string;
        name: string;
        slug: string;
      }>
    | null;
  product_variants: Array<{
    id: string;
    product_id: string;
    sku: string;
    price: number | string;
    manual_price: number | string | null;
    pricing_method: "manual" | "cwt_calculated" | null;
    width_in: number | string | null;
    height_in: number | string | null;
    wall_thickness_in: number | string | null;
    length_ft: number | string | null;
    material_density_lb_per_in3: number | string | null;
    steel_cwt_price: number | string | null;
    calculated_weight_lb: number | string | null;
    calculated_price: number | string | null;
    rounded_price: number | string | null;
    final_price: number | string | null;
    inventory_status: "in_stock" | "out_of_stock";
    inventory_quantity: number | null;
    image_url: string | null;
    length: string | null;
    material: string | null;
    finish: string | null;
    color: string | null;
  }>;
  product_images: Array<{
    id: string;
    product_id: string;
    variant_id: string | null;
    url: string;
    alt: string;
    sort_order: number;
  }>;
};

function numberOrUndefined(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function mapProduct(row: ProductRow, steelCwtPrice = DEFAULT_STEEL_CWT_PRICE): Product {
  const category = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;
  const variants: ProductVariant[] = row.product_variants.map((variant) => ({
    id: variant.id,
    productId: row.id,
    sku: variant.sku,
    price: Number(variant.final_price ?? variant.price),
    manual_price: numberOrUndefined(variant.manual_price) ?? null,
    calculated_price: numberOrUndefined(variant.calculated_price),
    rounded_price: numberOrUndefined(variant.rounded_price),
    final_price: numberOrUndefined(variant.final_price),
    pricing_method: variant.pricing_method || undefined,
    width_in: numberOrUndefined(variant.width_in),
    height_in: numberOrUndefined(variant.height_in),
    wall_thickness_in: numberOrUndefined(variant.wall_thickness_in),
    length_ft: numberOrUndefined(variant.length_ft),
    material_density_lb_per_in3: numberOrUndefined(variant.material_density_lb_per_in3),
    steel_cwt_price: numberOrUndefined(variant.steel_cwt_price),
    calculated_weight_lb: numberOrUndefined(variant.calculated_weight_lb),
    inventory: variant.inventory_status === "out_of_stock" ? "out_of_stock" : "in_stock",
    inventoryQuantity: Number(variant.inventory_quantity ?? 100),
    image: variant.image_url || row.product_images[0]?.url || "/assets/logo.svg",
    options: {
      length: variant.length || "Standard",
      material: variant.material || "Steel",
      finish: variant.finish || "Standard",
      color: variant.color || "Standard"
    }
  }));

  const images: ProductImage[] = row.product_images.map((image) => ({
    id: image.id,
    productId: image.product_id,
    variantId: image.variant_id || undefined,
    url: image.url,
    alt: image.alt || row.title,
    sortOrder: image.sort_order
  }));

  return applyTubingPricing({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: category || {
      id: "uncategorized",
      name: "Uncategorized",
      slug: "uncategorized"
    },
    price: Math.min(...variants.map((variant) => variant.price)),
    images,
    variants,
    specifications: row.specifications || {},
    details: row.details || []
  }, steelCwtPrice);
}

async function fetchSteelCwtPriceSetting() {
  const supabase = getSupabaseClient();
  if (!supabase) return DEFAULT_STEEL_CWT_PRICE;

  const { data, error } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "steel_cwt_price")
    .maybeSingle();

  if (error) {
    if (shouldRequireSupabase()) throw error;
    return DEFAULT_STEEL_CWT_PRICE;
  }

  return numberOrUndefined(data?.value as number | string | null) || DEFAULT_STEEL_CWT_PRICE;
}

export async function fetchSupabaseProducts() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldRequireSupabase()) {
      throw new Error("Supabase is required for the production catalog.");
    }
    return null;
  }

  const steelCwtPrice = await fetchSteelCwtPriceSetting();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      title,
      slug,
      description,
      details,
      specifications,
      categories (id, name, slug),
      product_variants (
        id,
        product_id,
        sku,
        price,
        manual_price,
        pricing_method,
        width_in,
        height_in,
        wall_thickness_in,
        length_ft,
        material_density_lb_per_in3,
        steel_cwt_price,
        calculated_weight_lb,
        calculated_price,
        rounded_price,
        final_price,
        inventory_status,
        inventory_quantity,
        image_url,
        length,
        material,
        finish,
        color
      ),
      product_images (
        id,
        product_id,
        variant_id,
        url,
        alt,
        sort_order
      )
    `
    )
    .eq("status", "active")
    .order("title", { ascending: true });

  if (error) {
    if (shouldRequireSupabase()) {
      throw error;
    }
    console.warn("Supabase catalog unavailable, using local seed.", error.message);
    return null;
  }

  return (data as unknown as ProductRow[])
    .map((row) => mapProduct(row, steelCwtPrice))
    .filter((product) => product.variants.length);
}

export async function fetchSupabaseProduct(slug: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (shouldRequireSupabase()) {
      throw new Error("Supabase is required for production product pages.");
    }
    return null;
  }

  const steelCwtPrice = await fetchSteelCwtPriceSetting();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      title,
      slug,
      description,
      details,
      specifications,
      categories (id, name, slug),
      product_variants (
        id,
        product_id,
        sku,
        price,
        manual_price,
        pricing_method,
        width_in,
        height_in,
        wall_thickness_in,
        length_ft,
        material_density_lb_per_in3,
        steel_cwt_price,
        calculated_weight_lb,
        calculated_price,
        rounded_price,
        final_price,
        inventory_status,
        inventory_quantity,
        image_url,
        length,
        material,
        finish,
        color
      ),
      product_images (
        id,
        product_id,
        variant_id,
        url,
        alt,
        sort_order
      )
    `
    )
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    if (shouldRequireSupabase()) {
      throw error;
    }
    console.warn("Supabase product unavailable, using local seed.", error.message);
    return null;
  }

  if (!data) return null;

  return mapProduct(data as unknown as ProductRow, steelCwtPrice);
}
