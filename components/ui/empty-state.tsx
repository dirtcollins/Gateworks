import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  bordered?: boolean;
};

export function EmptyState({
  action,
  bordered = true,
  className,
  description,
  title
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "grid place-items-center gap-3 text-center",
        bordered
          ? "border border-dashed border-industrial-rail bg-industrial-paper p-6"
          : "py-4",
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
