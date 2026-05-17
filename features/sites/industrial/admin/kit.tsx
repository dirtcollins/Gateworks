"use client";

import type { ReactNode } from "react";
import { Eyebrow } from "@/features/sites/industrial/kit";

/* ------------------------------------------------------------------ *
 * INDUSTRIAL PRO — Admin/back-office shared kit.
 * Restrained editorial styling: hairline borders, decisive headers,
 * pine-green accents. Reuses the storefront Eyebrow + d1 tokens.
 * ------------------------------------------------------------------ */

/* ---- Admin page header -------------------------------------------- */
export function AdminHeader({
  eyebrow,
  title,
  description,
  action
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-d1-ink pb-4">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-d1-ink sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm text-d1-steel">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

/* ---- KPI / stat grid ---------------------------------------------- */
export type AdminStat = {
  label: string;
  value: string;
  hint?: string;
};

export function AdminStatGrid({ stats }: { stats: AdminStat[] }) {
  return (
    <section className="grid gap-px border border-d1-line bg-d1-line sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div className="bg-d1-card p-5" key={stat.label}>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-d1-steel">
            {stat.label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-d1-ink">{stat.value}</p>
          {stat.hint ? (
            <p className="mt-1 text-[12px] font-semibold text-d1-steel">{stat.hint}</p>
          ) : null}
        </div>
      ))}
    </section>
  );
}

/* ---- Section header (within a page) ------------------------------- */
export function AdminSection({
  title,
  action,
  children
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-d1-ink pb-3">
        <h2 className="text-xl font-extrabold tracking-tight text-d1-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

/* ---- Card surface ------------------------------------------------- */
export function AdminCard({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-d1-line bg-d1-card ${className}`}>{children}</div>
  );
}

/* ---- Status pill -------------------------------------------------- */
type PillTone = "neutral" | "pine" | "amber" | "red" | "ink";

const PILL_TONES: Record<PillTone, string> = {
  neutral: "border-d1-line bg-white text-d1-steel",
  pine: "border-d1-pine bg-d1-pine text-d1-paper",
  amber: "border-d1-amber bg-d1-amber text-d1-ink",
  red: "border-d1-red bg-d1-red text-d1-paper",
  ink: "border-d1-ink bg-d1-ink text-d1-paper"
};

export function AdminPill({
  tone = "neutral",
  children
}: {
  tone?: PillTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${PILL_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/* ---- Filter tab strip --------------------------------------------- */
export function AdminTabs<T extends string>({
  tabs,
  active,
  onSelect
}: {
  tabs: Array<{ id: T; label: string; count?: number }>;
  active: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.1em] transition ${
              isActive
                ? "bg-d1-ink text-d1-paper"
                : "text-d1-steel hover:text-d1-ink"
            }`}
            key={tab.id}
            onClick={() => onSelect(tab.id)}
            type="button"
          >
            {tab.label}
            {typeof tab.count === "number" ? (
              <span className={isActive ? "text-d1-paper/70" : "text-d1-steel/80"}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---- Empty state -------------------------------------------------- */
export function AdminEmptyState({
  icon,
  title,
  description
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="border border-dashed border-d1-line bg-d1-card px-6 py-16 text-center">
      {icon ? <div className="mb-3 flex justify-center text-d1-line">{icon}</div> : null}
      <p className="text-sm font-bold text-d1-ink">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-d1-steel">{description}</p>
      ) : null}
    </div>
  );
}

/* ---- Form field --------------------------------------------------- */
export function AdminField({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-d1-steel">
        {label}
      </span>
      {children}
    </label>
  );
}

export const adminInputClass =
  "h-10 w-full border border-d1-line bg-white px-3 text-sm text-d1-ink outline-none transition focus:border-d1-ink placeholder:text-d1-steel/70";

export const adminTextareaClass =
  "w-full border border-d1-line bg-white px-3 py-2 text-sm text-d1-ink outline-none transition focus:border-d1-ink placeholder:text-d1-steel/70";
