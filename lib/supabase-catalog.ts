import type { Product, ProductImage, ProductVariant } from "@/lib/types";
import { supabase } from "@/lib/supabase";

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

function mapProduct(row: ProductRow): Product {
  const category = Array.isArray(row.categories)
    ? row.categories[0]
    : row.categories;
  const variants: ProductVariant[] = row.product_variants.map((variant) => ({
    id: variant.id,
    productId: row.id,
    sku: variant.sku,
    price: Number(variant.price),
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

  return {
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
  };
}

export async function fetchSupabaseProducts() {
  if (!supabase) return null;

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
    console.warn("Supabase catalog unavailable, using local seed.", error.message);
    return null;
  }

  return (data as unknown as ProductRow[])
    .map(mapProduct)
    .filter((product) => product.variants.length);
}

export async function fetchSupabaseProduct(slug: string) {
  if (!supabase) return null;

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
    .single();

  if (error) {
    console.warn("Supabase product unavailable, using local seed.", error.message);
    return null;
  }

  return mapProduct(data as unknown as ProductRow);
}
