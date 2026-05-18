import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type {
  ProcurementOrder,
  ProcurementOrderInput,
  ProcurementOrderItem,
  ProcurementOrderItemInput,
  ProcurementStatus
} from "@/lib/quotes-data";

export const dynamic = "force-dynamic";

function isMissingSchema(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "42P01" ||
    error.code === "42703" ||
    /relation .* does not exist/i.test(error.message || "") ||
    /column .* does not exist/i.test(error.message || "")
  );
}

type ProcurementItemRow = {
  id: string;
  procurement_order_id: string;
  product_id: string | null;
  variant_id: string | null;
  sku: string | null;
  title: string | null;
  quantity_ordered: number | string | null;
  quantity_received: number | string | null;
  unit_cost: number | string | null;
  line_total: number | string | null;
};

type ProcurementOrderRow = {
  id: string;
  po_number: string | null;
  supplier_name: string | null;
  status: string | null;
  expected_at: string | null;
  notes: string | null;
  subtotal: number | string | null;
  total: number | string | null;
  created_at: string;
  updated_at: string;
  procurement_order_items?: ProcurementItemRow[];
};

const ORDER_SELECT =
  "id, po_number, supplier_name, status, expected_at, notes, subtotal, total, " +
  "created_at, updated_at, " +
  "procurement_order_items ( id, procurement_order_id, product_id, variant_id, " +
  "sku, title, quantity_ordered, quantity_received, unit_cost, line_total )";

function toClientItem(row: ProcurementItemRow): ProcurementOrderItem {
  return {
    id: row.id,
    procurementOrderId: row.procurement_order_id,
    productId: row.product_id || "",
    variantId: row.variant_id || "",
    sku: row.sku || "",
    title: row.title || "",
    quantityOrdered: Number(row.quantity_ordered ?? 0),
    quantityReceived: Number(row.quantity_received ?? 0),
    unitCost: Number(row.unit_cost ?? 0),
    lineTotal: Number(row.line_total ?? 0)
  };
}

function toClientOrder(row: ProcurementOrderRow): ProcurementOrder {
  return {
    id: row.id,
    poNumber: row.po_number || "",
    supplierName: row.supplier_name || "",
    status: (row.status as ProcurementStatus) || "draft",
    expectedAt: row.expected_at || null,
    notes: row.notes || "",
    subtotal: Number(row.subtotal ?? 0),
    total: Number(row.total ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.procurement_order_items || []).map(toClientItem)
  };
}

const poNumberFloor = 2000;

async function generatePoNumber(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>
): Promise<string> {
  const { data } = await admin
    .from("procurement_orders")
    .select("po_number")
    .order("created_at", { ascending: false })
    .limit(1000);

  const highest = (data || []).reduce((current, row) => {
    const value = Number(String(row.po_number || "").replace(/\D/g, ""));
    return Number.isFinite(value) ? Math.max(current, value) : current;
  }, poNumberFloor - 1);

  return `PPO-${highest + 1}`;
}

function toItemRow(orderId: string, item: ProcurementOrderItemInput) {
  const ordered = Number(item.quantityOrdered ?? 0) || 0;
  const unitCost = Number(item.unitCost ?? 0) || 0;
  return {
    procurement_order_id: orderId,
    product_id: item.productId || null,
    variant_id: item.variantId || null,
    sku: item.sku || null,
    title: item.title || null,
    quantity_ordered: ordered,
    quantity_received: Number(item.quantityReceived ?? 0) || 0,
    unit_cost: unitCost,
    line_total:
      item.lineTotal !== undefined
        ? Number(item.lineTotal) || 0
        : Number((unitCost * ordered).toFixed(2))
  };
}

function toOrderRow(input: ProcurementOrderInput) {
  const row: Record<string, unknown> = {};
  if (input.poNumber !== undefined) row.po_number = input.poNumber;
  if (input.supplierName !== undefined) row.supplier_name = input.supplierName;
  if (input.status !== undefined) row.status = input.status;
  if (input.expectedAt !== undefined) row.expected_at = input.expectedAt || null;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.subtotal !== undefined) row.subtotal = input.subtotal;
  if (input.total !== undefined) row.total = input.total;
  return row;
}

async function fetchOrderById(
  admin: NonNullable<ReturnType<typeof getSupabaseAdminClient>>,
  id: string
): Promise<ProcurementOrder | null> {
  const { data, error } = await admin
    .from("procurement_orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return toClientOrder(data as unknown as ProcurementOrderRow);
}

export async function GET() {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, configured: false, orders: [] });
  }

  const { data, error } = await admin
    .from("procurement_orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingSchema(error)) {
      return NextResponse.json({ ok: true, configured: false, orders: [] });
    }
    return NextResponse.json(
      { ok: false, configured: true, orders: [], reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    orders: ((data || []) as unknown as ProcurementOrderRow[]).map(toClientOrder)
  });
}

export async function POST(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as ProcurementOrderInput | null;
  if (!input) {
    return NextResponse.json({ ok: false, reason: "Invalid payload." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    const orderRow = toOrderRow(input);
    orderRow.po_number = input.poNumber || (await generatePoNumber(admin));
    if (orderRow.status === undefined) orderRow.status = "draft";

    const { data: created, error: orderError } = await admin
      .from("procurement_orders")
      .insert(orderRow)
      .select("id")
      .single();

    if (orderError) {
      if (isMissingSchema(orderError)) {
        return NextResponse.json({ ok: true, persisted: false });
      }
      throw orderError;
    }

    const orderId = created.id as string;
    const items = input.items || [];

    if (items.length) {
      const { error: itemsError } = await admin
        .from("procurement_order_items")
        .insert(items.map((item) => toItemRow(orderId, item)));
      if (itemsError) throw itemsError;
    }

    const order = await fetchOrderById(admin, orderId);
    return NextResponse.json({ ok: true, persisted: true, order });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Unknown procurement write error.";
    return NextResponse.json(
      { ok: false, persisted: false, reason: message },
      { status: 500 }
    );
  }
}

type ReceivePayload = {
  id?: string;
  action?: string;
  receipts?: Array<{ itemId?: string; quantityReceived?: number }>;
};

export async function PATCH(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as
    | (ProcurementOrderInput & ReceivePayload)
    | null;

  if (!input || !input.id) {
    return NextResponse.json(
      { ok: false, reason: "Procurement order id is required." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  try {
    // Receiving action: add to quantity_received per line, then recompute the
    // order status (partial when some but not all units are received,
    // received once every line is fully received).
    if (input.action === "receive") {
      const receipts = input.receipts || [];

      const { data: existingItems, error: readError } = await admin
        .from("procurement_order_items")
        .select("id, quantity_ordered, quantity_received")
        .eq("procurement_order_id", input.id);

      if (readError) {
        if (isMissingSchema(readError)) {
          return NextResponse.json({ ok: true, persisted: false });
        }
        throw readError;
      }

      const receiptById = new Map(
        receipts
          .filter((receipt) => receipt.itemId)
          .map((receipt) => [
            receipt.itemId as string,
            Number(receipt.quantityReceived ?? 0) || 0
          ])
      );

      const merged = (existingItems || []).map((row) => {
        const item = row as {
          id: string;
          quantity_ordered: number | string | null;
          quantity_received: number | string | null;
        };
        const added = receiptById.get(item.id) || 0;
        const ordered = Number(item.quantity_ordered ?? 0);
        const received = Number(item.quantity_received ?? 0) + added;
        return { id: item.id, ordered, received };
      });

      for (const item of merged) {
        if (!receiptById.has(item.id)) continue;
        const { error: updateItemError } = await admin
          .from("procurement_order_items")
          .update({ quantity_received: item.received })
          .eq("id", item.id);
        if (updateItemError) throw updateItemError;
      }

      const totalReceived = merged.reduce((sum, item) => sum + item.received, 0);
      const fullyReceived =
        merged.length > 0 && merged.every((item) => item.received >= item.ordered);
      const nextStatus: ProcurementStatus = fullyReceived
        ? "received"
        : totalReceived > 0
          ? "partial"
          : "draft";

      const { error: statusError } = await admin
        .from("procurement_orders")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", input.id);
      if (statusError) throw statusError;

      const order = await fetchOrderById(admin, input.id);
      return NextResponse.json({ ok: true, persisted: true, order });
    }

    const updates = toOrderRow(input);
    updates.updated_at = new Date().toISOString();

    const { error: updateError } = await admin
      .from("procurement_orders")
      .update(updates)
      .eq("id", input.id);

    if (updateError) {
      if (isMissingSchema(updateError)) {
        return NextResponse.json({ ok: true, persisted: false });
      }
      throw updateError;
    }

    // When `items` is supplied we replace the full line-item set.
    if (input.items) {
      const { error: deleteError } = await admin
        .from("procurement_order_items")
        .delete()
        .eq("procurement_order_id", input.id);
      if (deleteError) throw deleteError;

      if (input.items.length) {
        const { error: itemsError } = await admin
          .from("procurement_order_items")
          .insert(input.items.map((item) => toItemRow(input.id as string, item)));
        if (itemsError) throw itemsError;
      }
    }

    const order = await fetchOrderById(admin, input.id);
    return NextResponse.json({ ok: true, persisted: true, order });
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Unknown procurement write error.";
    return NextResponse.json(
      { ok: false, persisted: false, reason: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json(
      { ok: false, reason: "Procurement order id is required." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await admin.from("procurement_orders").delete().eq("id", id);

  if (error) {
    if (isMissingSchema(error)) {
      return NextResponse.json({ ok: true, persisted: false });
    }
    return NextResponse.json(
      { ok: false, persisted: false, reason: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
