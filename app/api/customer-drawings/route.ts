import { NextRequest, NextResponse } from "next/server";
import {
  adminAuthRequiredInThisEnvironment,
  authorizeAdminRequest
} from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const safePathPartPattern = /[^a-zA-Z0-9._-]+/g;

function makeStoragePath(orderNumber: string, file: File) {
  const safeOrderNumber = orderNumber.replace(safePathPartPattern, "-");
  const safeFileName = file.name.replace(safePathPartPattern, "-");
  return `${safeOrderNumber}/${Date.now()}-${safeFileName}`;
}

export async function POST(request: NextRequest) {
  if (adminAuthRequiredInThisEnvironment()) {
    const auth = await authorizeAdminRequest(request);
    if (!auth.ok) return auth.response;
  }

  const admin = getSupabaseAdminClient();

  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        persisted: false,
        reason: "Supabase service role is not configured. Drawing upload was not saved."
      },
      { status: process.env.NODE_ENV === "production" ? 503 : 200 }
    );
  }

  const formData = await request.formData();
  const orderNumber = String(formData.get("orderNumber") || "");
  const userId = String(formData.get("userId") || "guest");
  const customerName = String(formData.get("customerName") || userId);
  const drawings = formData
    .getAll("drawings")
    .filter((item): item is File => item instanceof File);

  if (!orderNumber || !drawings.length) {
    return NextResponse.json(
      { ok: false, reason: "orderNumber and at least one drawing are required." },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json(
      { ok: false, persisted: false, reason: orderError.message },
      { status: 500 }
    );
  }

  await admin.from("site_users").upsert(
    {
      id: userId,
      display_name: customerName || userId,
      normalized_name: (customerName || userId).toLowerCase(),
      last_used_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  const uploadedDrawings = [];

  for (const drawing of drawings) {
    const storagePath = makeStoragePath(orderNumber, drawing);
    const { error: uploadError } = await admin.storage
      .from("customer-drawings")
      .upload(storagePath, drawing, {
        contentType: drawing.type || "application/octet-stream",
        upsert: true
      });

    const publicUrl = admin.storage.from("customer-drawings").getPublicUrl(storagePath).data.publicUrl;

    const { error: insertError } = await admin.from("customer_drawing_uploads").insert({
      order_id: order?.id || null,
      site_user_id: userId,
      file_name: drawing.name,
      file_size: drawing.size,
      file_type: drawing.type || "application/octet-stream",
      storage_path: uploadError ? null : storagePath,
      public_url: uploadError ? null : publicUrl
    });

    if (insertError) {
      return NextResponse.json(
        { ok: false, persisted: false, reason: insertError.message },
        { status: 500 }
      );
    }

    uploadedDrawings.push({
      fileName: drawing.name,
      storagePath: uploadError ? null : storagePath,
      publicUrl: uploadError ? null : publicUrl,
      persisted: !uploadError,
      reason: uploadError?.message
    });
  }

  return NextResponse.json({
    ok: true,
    persisted: true,
    drawings: uploadedDrawings
  });
}
