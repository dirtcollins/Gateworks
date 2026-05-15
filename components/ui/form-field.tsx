import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormFieldProps = {
  children: ReactNode;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
};

export function FormField({
  children,
  className,
  error,
  hint,
  label
}: FormFieldProps) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
      <span className="font-black uppercase tracking-[0.08em] text-industrial-muted">
        {label}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-industrial-steel">{hint}</span>}
      {error && <span className="text-xs font-bold text-red-700">{error}</span>}
    </label>
  );
}
