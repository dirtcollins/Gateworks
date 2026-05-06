import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

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

const sourceProducts = raw.products.slice(0, 80);
const groups = new Map();

for (const item of sourceProducts) {
  const key = item.product_grouping || item.slug;
  groups.set(key, [...(groups.get(key) || []), item]);
}

const selectedGroups = Array.from(groups.entries()).slice(0, 50);

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

for (const [, items] of selectedGroups) {
  const first = items[0];

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

  const { data: product, error: productError } = await supabase
    .from("products")
    .upsert(
      {
        category_id: category.id,
        title: first.display_name,
        slug: first.slug,
        description: `${first.website_name || first.display_name} for gates, fencing, and exterior construction work.`,
        details: [
          "Simple product configuration for Phase 1.",
          "Variant changes update price, image, SKU, and inventory."
        ],
        specifications: {
          brand: "National Hardware",
          category: first.source_category,
          catalog_number: first.catalog_number,
          primary_sku: first.stock_number
        },
        status: "active"
      },
      { onConflict: "slug" }
    )
    .select()
    .single();

  if (productError) throw productError;

  for (const item of items) {
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .upsert(
        {
          product_id: product.id,
          sku: item.stock_number,
          price: Number(item.price || 0),
          inventory_status:
            item.availability === "Active" && !item.is_discontinued
              ? "in_stock"
              : "out_of_stock",
          inventory_quantity:
            item.availability === "Active" && !item.is_discontinued ? 25 : 0,
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
      const { error: imageError } = await supabase.from("product_images").insert({
        product_id: product.id,
        variant_id: variant.id,
        url: item.image,
        alt: item.display_name,
        sort_order: 0
      });

      if (imageError && imageError.code !== "23505") throw imageError;
    }
  }
}

console.log(`Seeded ${selectedGroups.length} products.`);
