import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export function PageShell({
  children,
  className,
  eyebrow,
  title,
  description,
  actions
}: PageShellProps) {
  return (
    <main className={cn("w-full px-4 py-4 md:py-6", className)}>
      {(title || eyebrow || description || actions) && (
        <section className="mb-4 border border-industrial-rail bg-white p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full">
              {eyebrow && (
                <p className="text-xs font-black uppercase tracking-[0.16em] text-industrial-muted">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h1 className="text-2xl font-black text-industrial-ink md:text-3xl">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-2 text-sm leading-6 text-industrial-steel">
                  {description}
                </p>
              )}
            </div>
            {actions}
          </div>
        </section>
      )}
      {children}
    </main>
  );
}
