// Wayfinder admin sign-in. Public route (allowed past the middleware gate);
// rendered bare via layout-chrome (no admin sidebar). Authenticates with
// Supabase email/password via the @supabase/ssr browser client so the session
// cookie is set for the middleware to read on the next request.
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { monoFont, sansFont, wf, wfFontVars } from "@/features/sites/wayfinder/kit";

// Only allow same-origin admin destinations as the post-login redirect target,
// so a crafted ?next= cannot bounce the user off-site.
function safeNext(next: string | null): string {
  if (!next) return "/admin";
  if (!next.startsWith("/admin")) return "/admin";
  if (next.startsWith("//")) return "/admin";
  return next;
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (signInError) {
        setError(signInError.message || "Sign-in failed. Check your details.");
        setBusy(false);
        return;
      }

      // Full navigation so the middleware re-runs with the fresh session
      // cookie and performs the admin-role check.
      router.replace(next);
      router.refresh();
    } catch {
      setError("Sign-in is unavailable right now. Try again shortly.");
      setBusy(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    background: wf.bone,
    border: `1px solid ${wf.hairline}`,
    color: wf.ink,
    fontSize: 14,
    fontFamily: sansFont,
    outline: "none"
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: wf.muted,
    marginBottom: 6
  };

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
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Brand mark — same lockup as the admin shell, no nav. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20
          }}
        >
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 32,
              height: 32,
              background: wf.safety,
              color: wf.ink,
              fontWeight: 900
            }}
          >
            W
          </span>
          <span style={{ display: "grid", lineHeight: 1.15 }}>
            <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "0.02em" }}>
              Wayfinder
            </span>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 9,
                letterSpacing: "0.14em",
                color: wf.muted,
                textTransform: "uppercase"
              }}
            >
              Operations · Admin sign-in
            </span>
          </span>
        </div>

        <div
          style={{
            background: "#fff",
            border: `1px solid ${wf.hairline}`,
            padding: 24
          }}
        >
          <h1 style={{ margin: "0 0 4px", fontSize: 19, fontWeight: 900 }}>
            Sign in
          </h1>
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 13,
              color: wf.steel,
              lineHeight: 1.5
            }}
          >
            Back-office access is restricted to authorized warehouse staff.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
            <div>
              <label htmlFor="admin-email" style={labelStyle}>
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={fieldStyle}
              />
            </div>

            <div>
              <label htmlFor="admin-password" style={labelStyle}>
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={fieldStyle}
              />
            </div>

            {error ? (
              <p
                role="alert"
                style={{
                  margin: 0,
                  padding: "8px 10px",
                  background: "#fdeceb",
                  border: `1px solid ${wf.red}`,
                  color: wf.red,
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 2,
                padding: "11px 12px",
                background: busy ? wf.steel : wf.ink,
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                cursor: busy ? "default" : "pointer"
              }}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 14, fontSize: 12, color: wf.muted }}>
          <Link href="/" style={{ color: wf.pine, fontWeight: 700 }}>
            ← Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}
