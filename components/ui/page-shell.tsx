import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  headerClassName?: string;
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
  titleClassName,
  descriptionClassName,
  eyebrow,
  title,
  description,
  actions
}: PageShellProps) {
  return (
    <main className={cn("w-full px-3 py-4 md:px-6 md:py-6", className)}>
      {(title || eyebrow || description || actions) && (
        <section className={cn("mx-auto mb-4 max-w-[1280px] rounded-lg border border-black/10 bg-white p-4 md:p-5", headerClassName)}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="w-full">
              {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-industrial-muted">
                  {eyebrow}
                </p>
              )}
              {title && (
                <h1 className={cn("mt-1 text-2xl font-semibold text-industrial-ink md:text-[2rem]", titleClassName)}>
                  {title}
                </h1>
              )}
              {description && (
                <p className={cn("mt-2 text-sm leading-6 text-industrial-steel", descriptionClassName)}>
                  {description}
                </p>
              )}
            </div>
            {actions}
          </div>
        </section>
      )}
      <div className="mx-auto max-w-[1280px]">{children}</div>
    </main>
  );
}
