import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { LEDGER } from "@/features/sites/ledger/kit";
import { LedgerChrome } from "@/features/sites/ledger/ledger-chrome";

export const metadata: Metadata = {
  title: {
    default: "Ledger | Gateworks Procurement Portal",
    template: "%s | Ledger"
  },
  description:
    "Ledger is the Gateworks procurement portal — gate hardware, structural steel, and welding supply with net terms, volume pricing, and spend reporting."
};

export default function LedgerLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen antialiased"
      style={{
        backgroundColor: LEDGER.canvas,
        color: LEDGER.ink,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <Suspense fallback={null}>
        <LedgerChrome>{children}</LedgerChrome>
      </Suspense>
    </div>
  );
}
