import type { SupabaseClient } from "@supabase/supabase-js";
import type { InventoryRow, InventoryStatus } from "@/features/admin/inventory/inventory-data";
import { getImageSet } from "@/lib/product-image";

type InventoryItemRow = {
  id: string;
  variant_id: string;
  location_id: string;
  bin_id: string | null;
  quantity_on_hand: number;
  quantity_reserved: number;
  reorder_point: number;
  updated_at: string;
  product_variants:
    | {
        id: string;
        product_id: string;
        sku: string;
        price: number | string;
        cost?: number | string | null;
        length: string | null;
        material: string | null;
        finish: string | null;
        products:
          | {
              id: string;
              title: string;
              slug: string;
              specifications: Record<string, string> | null;
              product_images: Array<{
                id: string;
                product_id: string;
                variant_id: string | null;
                url: string;
                alt: string;
                sort_order: number;
                thumb_url?: string | null;
                card_url?: string | null;
                medium_url?: string | null;
                full_url?: string | null;
              }> | null;
              categories:
                | {
                    name: string;
                    slug: string;
                  }
                | Array<{
                    name: string;
                    slug: string;
                  }>
                | null;
            }
          | Array<{
              id: string;
              title: string;
              slug: string;
              specifications: Record<string, string> | null;
              product_images: Array<{
                id: string;
                product_id: string;
                variant_id: string | null;
                url: string;
                alt: string;
                sort_order: number;
                thumb_url?: string | null;
                card_url?: string | null;
                medium_url?: string | null;
                full_url?: string | null;
              }> | null;
              categories:
                | {
                    name: string;
                    slug: string;
                  }
                | Array<{
                    name: string;
                    slug: string;
                  }>
                | null;
            }>
          | null;
      }
    | Array<{
        id: string;
        product_id: string;
        sku: string;
        price: number | string;
        cost?: number | string | null;
        length: string | null;
        material: string | null;
        finish: string | null;
        products: null;
      }>
    | null;
  inventory_locations:
    | {
        code: string;
      }
    | Array<{
        code: string;
      }>
    | null;
  inventory_bins:
    | {
        code: string;
      }
    | Array<{
        code: string;
      }>
    | null;
};

export type InventoryMutationAction =
  | "receive"
  | "add"
  | "remove"
  | "adjust"
  | "reserve"
  | "release"
  | "transfer"
  | "cycle_count";

export type InventoryMutationInput = {
  action: InventoryMutationAction;
  inventoryItemId?: string;
  variantId?: string;
  sku?: string;
  quantity: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  locationCode?: string;
  binCode?: string;
};

type InventoryMutationResult = {
  ok: boolean;
  item?: InventoryRow;
  reason?: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function asUuid(value?: string) {
  return value && uuidPattern.test(value) ? value : null;
}

type DatabaseInventoryEventType =
  | "receive"
  | "adjust"
  | "reserve"
  | "release"
  | "pick"
  | "ship"
  | "return"
  | "cycle_count";

const actionEventTypes: Record<InventoryMutationAction, DatabaseInventoryEventType> = {
  receive: "receive",
  add: "adjust",
  remove: "adjust",
  adjust: "adjust",
  reserve: "reserve",
  release: "release",
  transfer: "adjust",
  cycle_count: "cycle_count"
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function getStatus(quantityAvailable: number, reorderPoint: number): InventoryStatus {
  if (quantityAvailable <= 0) return "out_of_stock";
  if (quantityAvailable <= reorderPoint) return "low_stock";
  return "in_stock";
}

function mapInventoryRow(row: InventoryItemRow): InventoryRow {
  const variant = first(row.product_variants);
  const product = first(variant?.products);
  const category = first(product?.categories);
  const location = first(row.inventory_locations);
  const bin = first(row.inventory_bins);
  const quantityOnHand = Number(row.quantity_on_hand || 0);
  const quantityReserved = Number(row.quantity_reserved || 0);
  const quantityDamaged = 0;
  const quantityAvailable = Math.max(
    0,
    quantityOnHand - quantityReserved - quantityDamaged
  );
  const reorderPoint = Number(row.reorder_point || 0);
  const productImage =
    product?.product_images && product.product_images.length
      ? [...product.product_images]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((image) => ({
            id: image.id,
            productId: image.product_id,
            variantId: image.variant_id || undefined,
            url: image.url,
            alt: image.alt || product.title,
            sortOrder: image.sort_order,
            sizes: getImageSet(image.url, {
              thumb: image.thumb_url || undefined,
              card: image.card_url || undefined,
              medium: image.medium_url || undefined,
              full: image.full_url || undefined
            })
          }))[0]
      : undefined;

  return {
    id: row.id,
    productId: product?.id || variant?.product_id || "",
    variantId: row.variant_id,
    productTitle: product?.title || variant?.sku || "Inventory item",
    productSlug: product?.slug || "#",
    sku: variant?.sku || "",
    category: category?.name || "Uncategorized",
    categorySlug: category?.slug || "uncategorized",
    material: variant?.material || product?.specifications?.Material || "Steel",
    finish: variant?.finish || product?.specifications?.Finish || "Standard",
    size: variant?.length || "Standard",
    supplier:
      product?.specifications?.Brand ||
      product?.specifications?.["Retail Source"] ||
      "Primary supplier",
    locationCode: location?.code || "MAIN",
    binCode: bin?.code || "UNASSIGNED",
    quantityOnHand,
    quantityReserved,
    quantityDamaged,
    quantityAvailable,
    reorderPoint,
    status: getStatus(quantityAvailable, reorderPoint),
    unitCost: Number(variant?.cost || 0),
    unitPrice: Number(variant?.price || 0),
    productImage,
    lastUpdated: row.updated_at,
    history: []
  };
}

export async function listInventoryRows(admin: SupabaseClient) {
  const imageProjection = "product_images (id, product_id, variant_id, url, alt, sort_order)";
  const imageProjectionWithSizes = `product_images (id, product_id, variant_id, url, alt, sort_order, thumb_url, card_url, medium_url, full_url)`;

  async function queryRows(includeSizes: boolean) {
    const selectedImageProjection = includeSizes
      ? imageProjectionWithSizes
      : imageProjection;

    const { data, error } = await admin
      .from("inventory_items")
      .select(
        `
      id,
      variant_id,
      location_id,
      bin_id,
      quantity_on_hand,
      quantity_reserved,
      reorder_point,
      updated_at,
      product_variants (
        id,
        product_id,
        sku,
        price,
        cost,
        length,
        material,
        finish,
        products (
          id,
          title,
          slug,
          specifications,
          categories (name, slug),
          ${selectedImageProjection}
        )
      ),
      inventory_locations (code),
      inventory_bins (code)
    `
      )
      .order("updated_at", { ascending: false });

    return { data, error };
  }

  const optimized = await queryRows(true);

  if (optimized.error && optimized.error.code === "42703") {
    const legacy = await queryRows(false);
    if (legacy.error) throw legacy.error;
    return ((legacy.data || []) as unknown as InventoryItemRow[]).map(mapInventoryRow);
  }

  if (optimized.error) throw optimized.error;

  return ((optimized.data || []) as unknown as InventoryItemRow[]).map(mapInventoryRow);
}

async function getOrCreateLocation(
  admin: SupabaseClient,
  locationCode = "MAIN",
  binCode = "UNASSIGNED"
) {
  const { data: location, error: locationError } = await admin
    .from("inventory_locations")
    .upsert(
      {
        code: locationCode,
        name: locationCode,
        type: "warehouse",
        active: true
      },
      { onConflict: "code" }
    )
    .select("id, code")
    .single();

  if (locationError) throw locationError;

  const { data: bin, error: binError } = await admin
    .from("inventory_bins")
    .upsert(
      {
        location_id: location.id,
        code: binCode,
        active: true
      },
      { onConflict: "location_id,code" }
    )
    .select("id, code")
    .single();

  if (binError) throw binError;

  return { location, bin };
}

async function findVariantId(admin: SupabaseClient, input: InventoryMutationInput) {
  if (input.variantId && asUuid(input.variantId)) {
    return input.variantId;
  }
  if (!input.sku) return null;

  const { data, error } = await admin
    .from("product_variants")
    .select("id")
    .eq("sku", input.sku)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

async function fetchInventoryItem(
  admin: SupabaseClient,
  input: InventoryMutationInput
) {
  const inventoryItemId = asUuid(input.inventoryItemId);
  if (inventoryItemId) {
    const { data, error } = await admin
      .from("inventory_items")
      .select("*")
      .eq("id", inventoryItemId)
      .single();
    if (error) throw error;
    return data;
  }

  const variantId = await findVariantId(admin, input);
  if (!variantId) return null;

  const { location, bin } = await getOrCreateLocation(
    admin,
    input.locationCode,
    input.binCode
  );

  const { data: existingInventoryItem, error: existingItemError } = await admin
    .from("inventory_items")
    .select("*")
    .eq("variant_id", variantId)
    .eq("location_id", location.id)
    .eq("bin_id", bin.id)
    .maybeSingle();

  if (existingItemError) throw existingItemError;
  if (existingInventoryItem) return existingInventoryItem;

  const { data, error } = await admin
    .from("inventory_items")
    .upsert(
      {
        variant_id: variantId,
        location_id: location.id,
        bin_id: bin.id,
        quantity_on_hand: 0,
        quantity_reserved: 0,
        reorder_point: 0
      },
      { onConflict: "variant_id,location_id,bin_id", ignoreDuplicates: true }
    )
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function applyInventoryMutation(
  admin: SupabaseClient,
  input: InventoryMutationInput
): Promise<InventoryMutationResult> {
  if (
    (input.quantity === undefined || input.quantity === null) &&
    !["transfer", "cycle_count"].includes(input.action)
  ) {
    return { ok: false, reason: "Quantity is required." };
  }

  const current = await fetchInventoryItem(admin, input);
  if (!current) {
    return { ok: false, reason: "No matching product variant was found." };
  }

  const previousOnHand = Number(current.quantity_on_hand || 0);
  const previousReserved = Number(current.quantity_reserved || 0);
  let nextOnHand = previousOnHand;
  let nextReserved = previousReserved;
  let quantityDelta = input.quantity;

  if (input.action === "receive" || input.action === "add") {
    nextOnHand += input.quantity;
  }

  if (input.action === "remove") {
    const available = previousOnHand - previousReserved;
    if (input.quantity > available) {
      return { ok: false, reason: "Cannot remove more than available inventory." };
    }
    nextOnHand -= input.quantity;
    quantityDelta = -input.quantity;
  }

  if (input.action === "adjust" || input.action === "cycle_count") {
    if (input.quantity < previousReserved) {
      return {
        ok: false,
        reason: "Adjusted on-hand quantity cannot be below reserved quantity."
      };
    }
    nextOnHand = input.quantity;
    quantityDelta = input.quantity - previousOnHand;
  }

  if (input.action === "reserve") {
    const available = previousOnHand - previousReserved;
    if (input.quantity > available) {
      return { ok: false, reason: "Cannot reserve more than available inventory." };
    }
    nextReserved += input.quantity;
  }

  if (input.action === "release") {
    if (input.quantity > previousReserved) {
      return { ok: false, reason: "Cannot release more than reserved inventory." };
    }
    nextReserved -= input.quantity;
    quantityDelta = -input.quantity;
  }

  const updates: Record<string, unknown> = {
    quantity_on_hand: nextOnHand,
    quantity_reserved: nextReserved,
    updated_at: new Date().toISOString()
  };

  if (input.action === "transfer") {
    const { location, bin } = await getOrCreateLocation(
      admin,
      input.locationCode,
      input.binCode
    );
    updates.location_id = location.id;
    updates.bin_id = bin.id;
    quantityDelta = 0;
  }

  const { data: updated, error: updateError } = await admin
    .from("inventory_items")
    .update(updates)
    .eq("id", current.id)
    .select("id, variant_id")
    .single();

  if (updateError) throw updateError;

  const { error: eventError } = await admin.from("inventory_events").insert({
    variant_id: updated.variant_id,
    location_id: updates.location_id || current.location_id,
    bin_id: updates.bin_id || current.bin_id,
    event_type: actionEventTypes[input.action],
    quantity_delta: quantityDelta,
    quantity_on_hand_after: nextOnHand,
    quantity_reserved_after: nextReserved,
    reference_type: input.referenceType || null,
    reference_id: asUuid(input.referenceId),
    notes: input.reason || input.action
  });

  if (eventError) throw eventError;

  await admin
    .from("product_variants")
    .update({
      inventory_quantity: Math.max(0, nextOnHand - nextReserved),
      inventory_status: nextOnHand - nextReserved > 0 ? "in_stock" : "out_of_stock"
    })
    .eq("id", updated.variant_id);

  const rows = await listInventoryRows(admin);
  return {
    ok: true,
    item: rows.find((row) => row.id === current.id)
  };
}

export async function reserveInventoryForOrder(
  admin: SupabaseClient,
  orderId: string
) {
  if (!asUuid(orderId)) {
    return [{ ok: false, reason: "Order ID is not a persisted UUID." }];
  }

  const { data: orderItems, error } = await admin
    .from("order_items")
    .select("id, variant_id, sku, quantity")
    .eq("order_id", orderId);

  if (error) throw error;

  const results = [];
  for (const item of orderItems || []) {
    results.push(
      await applyInventoryMutation(admin, {
        action: "reserve",
        variantId: item.variant_id,
        sku: item.sku,
        quantity: Number(item.quantity || 0),
        reason: `Reserved for order ${orderId}.`,
        referenceType: "order",
        referenceId: orderId
      })
    );
  }

  return results;
}

export async function createPickTicketForOrder(
  admin: SupabaseClient,
  orderId: string
) {
  if (!asUuid(orderId)) return null;

  const { data: existingTicket, error: existingError } = await admin
    .from("pick_tickets")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingTicket?.id) return existingTicket.id;

  const { data: ticket, error: ticketError } = await admin
    .from("pick_tickets")
    .insert({
      order_id: orderId,
      status: "open"
    })
    .select("id")
    .single();

  if (ticketError) throw ticketError;

  const { data: orderItems, error: itemsError } = await admin
    .from("order_items")
    .select("id, variant_id, quantity")
    .eq("order_id", orderId);

  if (itemsError) throw itemsError;

  const ticketItems = (orderItems || [])
    .filter((item) => item.variant_id)
    .map((item) => ({
      pick_ticket_id: ticket.id,
      order_item_id: item.id,
      variant_id: item.variant_id,
      quantity_to_pick: Number(item.quantity || 0)
    }));

  if (ticketItems.length) {
    const { error } = await admin.from("pick_ticket_items").insert(ticketItems);
    if (error) throw error;
  }

  return ticket.id;
}
