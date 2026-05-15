import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-industrial-ink bg-industrial-ink text-white hover:bg-industrial-pine",
  secondary: "border-industrial-rail bg-white text-industrial-ink hover:border-industrial-ink",
  ghost: "border-transparent bg-transparent text-industrial-ink hover:border-industrial-rail hover:bg-industrial-paper",
  danger: "border-red-700 bg-white text-red-700 hover:bg-red-700 hover:text-white"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  icon: "size-10 p-0"
};

export function Button({
  children,
  className,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 border font-black uppercase tracking-[0.08em] transition disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

