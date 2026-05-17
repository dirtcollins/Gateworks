import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const SCOPES = new Set([
  "overall",
  "home",
  "product",
  "category",
  "cart",
  "orders",
  "reports"
]);

type RatingRow = {
  reviewer: string;
  design_id: string;
  scope: string;
  stars: number;
};

export async function GET() {
  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, configured: false, ratings: [] });
  }

  const { data, error } = await admin
    .from("design_lab_ratings")
    .select("reviewer, design_id, scope, stars");

  if (error) {
    // Table not yet created, or another storage error — degrade gracefully.
    return NextResponse.json({
      ok: true,
      configured: false,
      ratings: [],
      reason: error.message
    });
  }

  return NextResponse.json({
    ok: true,
    configured: true,
    ratings: (data as RatingRow[]) ?? []
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    reviewer?: string;
    designId?: string;
    scope?: string;
    stars?: number;
  } | null;

  const reviewer = body?.reviewer?.trim().slice(0, 40);
  const designId = body?.designId?.trim().slice(0, 12);
  const scope = body?.scope?.trim() || "overall";
  const stars = Number(body?.stars);

  if (
    !reviewer ||
    !designId ||
    !SCOPES.has(scope) ||
    !Number.isInteger(stars) ||
    stars < 0 ||
    stars > 5
  ) {
    return NextResponse.json(
      { ok: false, reason: "Invalid rating payload." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Zero stars clears the reviewer's vote for this target.
  if (stars === 0) {
    const { error } = await admin
      .from("design_lab_ratings")
      .delete()
      .match({ reviewer, design_id: designId, scope });

    if (error) {
      return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, persisted: true, cleared: true });
  }

  const { error } = await admin.from("design_lab_ratings").upsert(
    {
      reviewer,
      design_id: designId,
      scope,
      stars,
      updated_at: new Date().toISOString()
    },
    { onConflict: "reviewer,design_id,scope" }
  );

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
