// Wayfinder admin — access denied. Shown by the middleware when an
// authenticated Supabase user has no admin role in admin_profiles. Public
// route; rendered bare via layout-chrome (no admin sidebar). Offers a
// sign-out (clears the session) and a route back to the storefront.
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { monoFont, sansFont, wf, wfFontVars } from "@/features/sites/wayfinder/kit";

export default function AdminAccessDeniedPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore — fall through to the login route regardless.
    }
    // Full navigation so the middleware re-runs with the cleared session.
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div
      className={wfFontVars}
      style={{
        fontFamily: sansFont,
        background: wf.paper,
        color: wf.ink,
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          border: `1px solid ${wf.hairline}`,
          padding: 28
        }}
      >
        <span
          style={{
            display: "inline-block",
            fontFamily: monoFont,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: wf.red,
            marginBottom: 10
          }}
        >
          403 · Access denied
        </span>
        <h1 style={{ margin: "0 0 8px", fontSize: 21, fontWeight: 900 }}>
          You are not authorized
        </h1>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: wf.steel,
            lineHeight: 1.55
          }}
        >
          Your account is signed in but has no Wayfinder operations role. If
          you believe this is a mistake, ask an owner to grant your account an
          admin role.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            style={{
              padding: "10px 16px",
              background: busy ? wf.steel : wf.ink,
              color: "#fff",
              border: "none",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              cursor: busy ? "default" : "pointer"
            }}
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
          <Link
            href="/"
            style={{
              padding: "10px 16px",
              background: wf.bone,
              border: `1px solid ${wf.hairline}`,
              color: wf.ink,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              textDecoration: "none"
            }}
          >
            Back to storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
