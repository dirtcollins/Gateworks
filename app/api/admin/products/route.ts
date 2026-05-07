import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type AdminPatchBody =
  | {
      action: "update_product";
      productId: string;
      changes: Record<string, unknown>;
    }
  | {
      action: "update_variant";
      variantId: string;
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
  "inventory_status",
  "inventory_quantity",
  "image_url",
  "length",
  "material",
  "finish",
  "color"
]);

const imageFields = new Set(["url", "alt", "sort_order"]);

const adminRoles = new Set([
  "owner",
  "admin",
  "merchandiser",
  "inventory_manager",
  "content_editor"
]);

function pickAllowed(
  changes: Record<string, unknown>,
  allowedFields: Set<string>
) {
  return Object.fromEntries(
    Object.entries(changes).filter(([key]) => allowedFields.has(key))
  );
}

async function authorizeAdminRequest(request: NextRequest) {
  if (!supabaseAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          reason: "Supabase service role is not configured. Saved locally only."
        },
        { status: 503 }
      )
    };
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ADMIN_REQUIRE_AUTH !== "true"
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          reason: "Admin writes require Supabase Auth before production."
        },
        { status: 403 }
      )
    };
  }

  if (process.env.ADMIN_REQUIRE_AUTH !== "true") {
    return { ok: true as const, actorId: null };
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, reason: "Admin login is required." },
        { status: 401 }
      )
    };
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, reason: "Invalid admin session." },
        { status: 401 }
      )
    };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("admin_profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile?.role ||
    !adminRoles.has(String(profile.role))
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, reason: "Admin permissions are required." },
        { status: 403 }
      )
    };
  }

  return { ok: true as const, actorId: userData.user.id };
}

async function writeAuditLog(
  action: string,
  entityId: string,
  changes: unknown,
  actorId: string | null
) {
  if (!supabaseAdmin) return;

  await supabaseAdmin.from("admin_audit_logs").insert({
    actor_id: actorId,
    action,
    entity_id: entityId,
    entity_type: action.split("_")[1] || "product",
    changes
  });
}

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdminRequest(request);
  if (!auth.ok) return auth.response;
  const admin = supabaseAdmin;
  if (!admin) {
    return NextResponse.json(
      {
        ok: false,
        reason: "Supabase service role is not configured. Saved locally only."
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
      const { error } = await admin
        .from("product_variants")
        .update(changes)
        .eq("id", body.variantId);

      if (error) throw error;
      await writeAuditLog(body.action, body.variantId, changes, auth.actorId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "update_image") {
      const changes = pickAllowed(body.changes, imageFields);
      const { error } = await admin
        .from("product_images")
        .update(changes)
        .eq("id", body.imageId);

      if (error) throw error;
      await writeAuditLog(body.action, body.imageId, changes, auth.actorId);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "add_image") {
      const { data, error } = await admin
        .from("product_images")
        .insert({
          product_id: body.productId,
          url: body.image.url,
          alt: body.image.alt,
          sort_order: body.image.sort_order
        })
        .select()
        .single();

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
