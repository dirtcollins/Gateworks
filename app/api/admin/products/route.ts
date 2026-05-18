import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { authorizeAdminRequest } from "@/lib/admin-auth";
import { calculateTubingCwtPricing } from "@/lib/pricing";
import { getImageSet } from "@/lib/product-image";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type AdminPatchBody =
  | {
      action: "update_product";
      productId: string;
      changes: Record<string, unknown>;
    }
  | {
      action: "update_variant";
      variantId?: string;
      sku?: string;
      changes: Record<string, unknown>;
    }
  | {
      action: "update_image";
      imageId: string;
      changes: Record<string, unknown>;
    }
  | {
      action: "add_image";
      productId: string;
      image: {
        url: string;
        alt: string;
        sort_order: number;
      };
    }
  | {
      action: "delete_image";
      imageId: string;
    };

const productFields = new Set([
  "title",
  "description",
  "details",
  "specifications",
  "category_id",
  "status"
]);

const variantFields = new Set([
  "price",
  "cost",
  "manual_price",
  "calculated_price",
  "rounded_price",
  "final_price",
  "pricing_method",
  "width_in",
  "height_in",
  "wall_thickness_in",
  "length_ft",
  "material_density_lb_per_in3",
  "steel_cwt_price",
  "calculated_weight_lb",
  "inventory_status",
  "inventory_quantity",
  "image_url",
  "length",
  "material",
  "finish",
  "color"
]);

const imageFields = new Set(["url", "alt", "sort_order"]);
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(value: string | null | undefined) {
  return value && uuidPattern.test(value) ? value : null;
}

type ProductImagePayload = {
  product_id: string;
  url: string;
  alt: string;
  sort_order: number;
  thumb_url?: string;
  card_url?: string;
  medium_url?: string;
  full_url?: string;
};

function buildProductImagePayload(
  productId: string,
  image: {
    url: string;
    alt: string;
    sort_order: number;
  }
): ProductImagePayload {
  const imageSet = getImageSet(image.url);
  return {
    product_id: productId,
    url: image.url,
    alt: image.alt,
    sort_order: image.sort_order,
    thumb_url: imageSet.thumb,
    card_url: imageSet.card,
    medium_url: imageSet.medium,
    full_url: imageSet.full
  };
}

async function addProductImageWithFallback(admin: any, payload: ProductImagePayload) {
  const extendedResult = await admin
    .from("product_images")
    .insert({
      product_id: payload.product_id,
      url: payload.url,
      alt: payload.alt,
      sort_order: payload.sort_order,
      thumb_url: payload.thumb_url,
      card_url: payload.card_url,
      medium_url: payload.medium_url,
      full_url: payload.full_url
    })
    .select()
    .single();

  if (!extendedResult.error) {
    return extendedResult;
  }

  if (extendedResult.error.code !== "42703") {
    return extendedResult;
  }

  return admin
    .from("product_images")
    .insert({
      product_id: payload.product_id,
      url: payload.url,
      alt: payload.alt,
      sort_order: payload.sort_order
    })
    .select()
    .single();
}

async function patchProductImageWithFallback(
  admin: any,
  imageId: string,
  changes: Record<string, unknown>
) {
  const imageUrl = typeof changes.url === "string" ? changes.url.trim() : null;
  const includeImageSet = typeof imageUrl === "string" && imageUrl.length > 0;

  const extendedChanges = includeImageSet
    ? {
        ...changes,
        thumb_url: getImageSet(imageUrl).thumb,
        card_url: getImageSet(imageUrl).card,
        medium_url: getImageSet(imageUrl).medium,
        full_url: getImageSet(imageUrl).full
      }
    : changes;

  const extendedResult = await admin
    .from("product_images")
    .update(extendedChanges)
    .eq("id", imageId);

  if (!extendedResult.error) {
    return extendedResult;
  }

  if (extendedResult.error.code !== "42703") {
    return extendedResult;
  }

  return admin.from("product_images").update(changes).eq("id", imageId);
}

function pickAllowed(
  changes: Record<string, unknown>,
  allowedFields: Set<string>
) {
  return Object.fromEntries(
    Object.entries(changes).filter(([key]) => allowedFields.has(key))
  );
}

function toNumber(value: unknown) {
  const numberValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : NaN;

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

const cwtRecalculationFields = new Set([
  "manual_price",
  "pricing_method",
  "width_in",
  "height_in",
  "wall_thickness_in",
  "length_ft",
  "material_density_lb_per_in3",
  "steel_cwt_price"
]);

async function resolveVariantIdForUpdate(
  admin: SupabaseClient,
  body: Extract<AdminPatchBody, { action: "update_variant" }>
) {
  const directVariantId = asUuid(body.variantId);
  if (directVariantId) return directVariantId;

  if (!body.sku) return null;

  const { data, error } = await admin
    .from("product_variants")
    .select("id")
    .eq("sku", body.sku)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

function needsCwtRecalculation(changes: Record<string, unknown>) {
  return Object.keys(changes).some((key) => cwtRecalculationFields.has(key));
}

async function writeAuditLog(
  action: string,
  entityId: string,
  changes: unknown,
  actorId: string | null
) {
  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) return;

  await supabaseAdmin.from("admin_audit_logs").insert({
    actor_id: actorId,
    action,
    entity_id: entityId,
    entity_type: action.split("_")[1] || "product",
    changes
  });
}

async function writeStockAdjustmentRecord(
  admin: SupabaseClient,
  input: {
    actorId: string | null;
    productId: string | null;
    variantId: string;
    previousStock: number;
    newStock: number;
  }
) {
  const adjustmentAmount = input.newStock - input.previousStock;
  if (adjustmentAmount === 0) return;

  const createdAt = new Date().toISOString();
  const adjustment = {
    product_id: input.productId,
    previous_stock: input.previousStock,
    new_stock: input.newStock,
    adjustment_amount: adjustmentAmount,
    reason: "admin quick edit",
    edited_by: input.actorId,
    created_at: createdAt
  };

  const { data: inventoryItem } = await admin
    .from("inventory_items")
    .select("location_id, bin_id, quantity_reserved")
    .eq("variant_id", input.variantId)
    .maybeSingle();

  const { error: eventError } = await admin.from("inventory_events").insert({
    variant_id: input.variantId,
    location_id: inventoryItem?.location_id || null,
    bin_id: inventoryItem?.bin_id || null,
    event_type: "adjust",
    quantity_delta: adjustmentAmount,
    quantity_on_hand_after: input.newStock,
    quantity_reserved_after: Number(inventoryItem?.quantity_reserved || 0),
    reference_type: "admin_quick_edit",
    reference_id: input.productId,
    notes: JSON.stringify(adjustment),
    actor_id: input.actorId
  });

  if (eventError && eventError.code !== "42P01") {
    throw eventError;
  }

  await writeAuditLog(
    "stock_adjustment",
    input.productId || input.variantId,
    adjustment,
    input.actorId
  );
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Supabase service role is not configured. Change was not saved."
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as AdminPatchBody;

  try {
    if (body.action === "update_product") {
      const changes = pickAllowed(body.changes, productFields);
      const { error } = await admin
        .from("products")
        .update(changes)
        .eq("id", body.productId);

      if (error) throw error;
      await writeAuditLog(body.action, body.productId, changes, auth.actorId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update_variant") {
      const changes = pickAllowed(body.changes, variantFields);
      const variantId = await resolveVariantIdForUpdate(admin, body);

      if (!variantId) {
        return NextResponse.json(
          {
            ok: false,
            reason:
              "No matching product variant was found. Edit by SKU or open synced product row."
          },
          { status: 400 }
        );
      }

      const { data: previousVariant, error: previousVariantError } = await admin
        .from("product_variants")
        .select("id, product_id, inventory_quantity")
        .eq("id", variantId)
        .maybeSingle();

      if (previousVariantError) throw previousVariantError;

      const { data: updatedVariant, error } = await admin
        .from("product_variants")
        .update(changes)
        .eq("id", variantId)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!updatedVariant) {
        return NextResponse.json(
          {
            ok: false,
            reason: "No matching product variant was found."
          },
          { status: 400 }
        );
      }
      let persistedChanges = changes;

      if (Object.prototype.hasOwnProperty.call(changes, "inventory_quantity")) {
        const previousStock = Number(previousVariant?.inventory_quantity ?? 0);
        const newStock = Number(changes.inventory_quantity ?? previousStock);

        if (Number.isFinite(newStock)) {
          await writeStockAdjustmentRecord(admin, {
            actorId: auth.actorId,
            productId: previousVariant?.product_id || null,
            variantId,
            previousStock,
            newStock
          });
        }
      }

      if (needsCwtRecalculation(changes)) {
        const { data: variant, error: variantError } = await admin
            .from("product_variants")
            .select(
            `
            width_in,
            height_in,
            wall_thickness_in,
            length_ft,
            material_density_lb_per_in3,
            steel_cwt_price,
            manual_price,
            pricing_method
          `
          )
          .eq("id", variantId)
          .maybeSingle();

        if (variantError) throw variantError;

        if (variant?.pricing_method === "cwt_calculated") {
          const pricing = calculateTubingCwtPricing({
            width_in: toNumber(variant.width_in) || 0,
            height_in: toNumber(variant.height_in) || 0,
            wall_thickness_in: toNumber(variant.wall_thickness_in) || 0,
            length_ft: toNumber(variant.length_ft),
            material_density_lb_per_in3: toNumber(variant.material_density_lb_per_in3),
            steel_cwt_price: toNumber(variant.steel_cwt_price),
            manual_price: toNumber(variant.manual_price) ?? null,
            pricing_method: variant.pricing_method
          });

          if (pricing) {
            const recalculatedChanges = {
              price: pricing.final_price,
              manual_price: pricing.manual_price,
              calculated_price: pricing.calculated_price,
              rounded_price: pricing.rounded_price,
              final_price: pricing.final_price,
              pricing_method: pricing.pricing_method,
              width_in: pricing.width_in,
              height_in: pricing.height_in,
              wall_thickness_in: pricing.wall_thickness_in,
              length_ft: pricing.length_ft,
              material_density_lb_per_in3: pricing.material_density_lb_per_in3,
              steel_cwt_price: pricing.steel_cwt_price,
              calculated_weight_lb: pricing.calculated_weight_lb
            };

            const { error: pricingError } = await admin
              .from("product_variants")
              .update(recalculatedChanges)
              .eq("id", variantId);

            if (pricingError) throw pricingError;
            persistedChanges = { ...changes, ...recalculatedChanges };
          }
        }
      }

      await writeAuditLog(
        body.action,
        variantId,
        persistedChanges,
        auth.actorId
      );
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update_image") {
      const changes = pickAllowed(body.changes, imageFields);
      const { error } = await patchProductImageWithFallback(admin, body.imageId, changes);

      if (error) throw error;
      await writeAuditLog(body.action, body.imageId, changes, auth.actorId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "add_image") {
      const payload = buildProductImagePayload(body.productId, body.image);
      const { data, error } = await addProductImageWithFallback(admin, payload);

      if (error) throw error;
      await writeAuditLog(body.action, body.productId, body.image, auth.actorId);
      return NextResponse.json({ ok: true, image: data });
    }

    if (body.action === "delete_image") {
      const { error } = await admin
        .from("product_images")
        .delete()
        .eq("id", body.imageId);

      if (error) throw error;
      await writeAuditLog(body.action, body.imageId, {}, auth.actorId);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, reason: "Unsupported admin action." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason: error instanceof Error ? error.message : "Unknown admin write error."
      },
      { status: 500 }
    );
  }
}

// ─── Product creation ────────────────────────────────────────────────────────
type CreateVariantInput = {
  sku?: string;
  price?: number | string;
  cost?: number | string;
  inventoryQuantity?: number | string;
  inventoryStatus?: "in_stock" | "out_of_stock";
  length?: string;
  material?: string;
  finish?: string;
  color?: string;
};

type CreateProductBody = {
  product?: {
    title?: string;
    description?: string;
    details?: string[];
    specifications?: Record<string, string>;
  };
  categoryId?: string;
  newCategoryName?: string;
  variants?: CreateVariantInput[];
  images?: Array<{ url?: string; alt?: string }>;
};

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

async function uniqueSlug(admin: SupabaseClient, table: string, base: string) {
  let candidate = base;
  for (let attempt = 2; attempt < 60; attempt += 1) {
    const { data } = await admin
      .from(table)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt}`;
  }
  return `${base}-${Date.now()}`;
}

function badRequest(reason: string) {
  return NextResponse.json({ ok: false, reason }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Supabase service role is not configured. Product was not created."
      },
      { status: 503 }
    );
  }

  const body = (await request.json()) as CreateProductBody;
  const title = (body.product?.title || "").trim();
  if (!title) return badRequest("Give the product a name.");

  const variantInputs = (body.variants || []).filter((variant) =>
    (variant.sku || "").trim()
  );
  if (!variantInputs.length) {
    return badRequest("Add at least one variant with a SKU and price.");
  }
  for (const variant of variantInputs) {
    const price = Number(variant.price);
    if (!Number.isFinite(price) || price < 0) {
      return badRequest(`Enter a valid price for SKU ${variant.sku}.`);
    }
  }

  try {
    // 1. Resolve the category — an existing id, or a freshly created one.
    let categoryId = asUuid(body.categoryId);
    if (!categoryId) {
      const newName = (body.newCategoryName || "").trim();
      if (!newName) return badRequest("Pick a category or name a new one.");
      const categorySlug = await uniqueSlug(admin, "categories", slugify(newName));
      const { data: category, error: categoryError } = await admin
        .from("categories")
        .insert({ name: newName, slug: categorySlug })
        .select("id")
        .single();
      if (categoryError) throw categoryError;
      categoryId = category.id as string;
    }

    // 2. Reject duplicate SKUs up front so the operator gets a clear message.
    const skus = variantInputs.map((variant) => (variant.sku as string).trim());
    const { data: existingSkus, error: skuError } = await admin
      .from("product_variants")
      .select("sku")
      .in("sku", skus);
    if (skuError) throw skuError;
    if (existingSkus && existingSkus.length) {
      return badRequest(
        `SKU already in use: ${existingSkus
          .map((row: { sku: string }) => row.sku)
          .join(", ")}.`
      );
    }

    // 3. Create the product row.
    const productSlug = await uniqueSlug(admin, "products", slugify(title));
    const { data: product, error: productError } = await admin
      .from("products")
      .insert({
        category_id: categoryId,
        title,
        slug: productSlug,
        description: (body.product?.description || "").trim(),
        details: Array.isArray(body.product?.details) ? body.product?.details : [],
        specifications:
          body.product?.specifications &&
          typeof body.product.specifications === "object"
            ? body.product.specifications
            : {},
        status: "active"
      })
      .select("id")
      .single();
    if (productError) throw productError;
    const productId = product.id as string;

    // 4. Create variants — retry without `cost` if that column is absent.
    const variantRows = variantInputs.map((variant) => ({
      product_id: productId,
      sku: (variant.sku as string).trim(),
      price: Number(variant.price) || 0,
      cost:
        variant.cost === undefined || variant.cost === ""
          ? null
          : Number(variant.cost) || 0,
      pricing_method: "manual",
      inventory_status:
        variant.inventoryStatus === "out_of_stock" ? "out_of_stock" : "in_stock",
      inventory_quantity: Math.max(
        0,
        Math.floor(Number(variant.inventoryQuantity) || 0)
      ),
      length: variant.length?.trim() || null,
      material: variant.material?.trim() || null,
      finish: variant.finish?.trim() || null,
      color: variant.color?.trim() || null
    }));

    let variantError = (await admin.from("product_variants").insert(variantRows))
      .error;
    if (variantError && variantError.code === "42703") {
      const withoutCost = variantRows.map((row) => {
        const next = { ...row };
        delete (next as { cost?: unknown }).cost;
        return next;
      });
      variantError = (await admin.from("product_variants").insert(withoutCost)).error;
    }
    if (variantError) {
      // Roll the product back so a failed variant insert leaves nothing behind.
      await admin.from("products").delete().eq("id", productId);
      throw variantError;
    }

    // 5. Optional images.
    const images = (body.images || []).filter((image) => (image.url || "").trim());
    for (let index = 0; index < images.length; index += 1) {
      const image = images[index];
      const payload = buildProductImagePayload(productId, {
        url: (image.url as string).trim(),
        alt: image.alt?.trim() || title,
        sort_order: index
      });
      await addProductImageWithFallback(admin, payload);
    }

    await writeAuditLog(
      "create_product",
      productId,
      { title, slug: productSlug },
      auth.actorId
    );
    return NextResponse.json({ ok: true, productId, slug: productSlug });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        reason:
          error instanceof Error
            ? error.message
            : "Unknown product creation error."
      },
      { status: 500 }
    );
  }
}
