import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToolbarProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Toolbar({ children, className, ...props }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border border-industrial-rail bg-white p-3 md:flex-row md:items-center md:justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ToolbarGroup({ children, className, ...props }: ToolbarProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      {children}
    </div>
  );
}
