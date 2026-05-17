import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
};

export function PageShell({
  children,
  className,
  headerClassName,
  contentClassName,
  titleClassName,
  descriptionClassName,
  eyebrow,
  title,
  description,
  actions
}: PageShellProps) {
  return (
    <main className={cn("w-full px-3 py-3 md:px-4 md:py-4", className)}>
      {(title || eyebrow || description || actions) && (
        <section className={cn("mb-3 w-full max-w-[1440px] border-b border-black/10 pb-3", headerClassName)}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-industrial-muted">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h1 className={cn("mt-0.5 text-xl font-semibold leading-tight text-industrial-ink md:text-2xl", titleClassName)}>
                  {title}
                </h1>
              )}
              {description && (
                <p className={cn("mt-1 max-w-3xl text-sm leading-5 text-industrial-steel", descriptionClassName)}>
                  {description}
                </p>
              )}
            </div>
            {actions}
          </div>
        </section>
      )}
      <div className={cn("w-full max-w-[1440px]", contentClassName)}>{children}</div>
    </main>
  );
}
