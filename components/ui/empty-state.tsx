import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  action,
  className,
  description,
  title
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center gap-3 border border-dashed border-industrial-rail bg-industrial-paper p-6 text-center",
        className
      )}
    >
      <PackageOpen className="text-industrial-muted" size={28} />
      <div>
        <p className="font-black text-industrial-ink">{title}</p>
        {description && (
          <p className="mt-1 max-w-xl text-sm leading-6 text-industrial-steel">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
