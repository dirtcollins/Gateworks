"use client";

import { useState, type FormEvent } from "react";
import { trackEvent } from "@/lib/analytics";

type SignupStatus = "idle" | "loading" | "success" | "error";

export function EmailSignup({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SignupStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source })
      });
      const result = (await response.json()) as { ok?: boolean; reason?: string };

      if (response.ok && result.ok) {
        setStatus("success");
        setMessage("Thanks — you're on the list.");
        setEmail("");
        trackEvent("newsletter_signup", { source });
      } else {
        setStatus("error");
        setMessage(result.reason || "Subscription failed. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  }

  return (
    <form className="grid gap-1.5" onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <label className="sr-only" htmlFor="footer-email-signup">
          Email address
        </label>
        <input
          className="h-10 min-w-0 flex-1 rounded-md border border-industrial-rail bg-white px-3 text-sm text-industrial-ink outline-none focus:border-industrial-ink"
          id="footer-email-signup"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          required
          type="email"
          value={email}
        />
        <button
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-industrial-ink bg-industrial-ink px-4 text-xs font-black uppercase tracking-[0.08em] text-white transition hover:bg-industrial-pine active:translate-y-px disabled:opacity-60"
          disabled={status === "loading"}
          type="submit"
        >
          {status === "loading" ? "…" : "Subscribe"}
        </button>
      </div>
      {message ? (
        <p
          aria-live="polite"
          className={
            status === "success"
              ? "text-xs font-semibold text-industrial-pine"
              : "text-xs font-semibold text-industrial-red"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
