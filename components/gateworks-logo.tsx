import Image from "next/image";
import clsx from "clsx";

type GateworksLogoProps = {
  variant?: "light" | "dark";
  className?: string;
  height?: number;
  width?: number;
  priority?: boolean;
};

export function GateworksLogo({
  variant = "light",
  className,
  height = 26,
  width = 184,
  priority = false
}: GateworksLogoProps) {
  const variantClass = variant === "dark" ? "brightness-0 invert" : "";

  return (
    <Image
      alt="Gateworks"
      className={clsx("h-auto w-auto object-contain", variantClass, className)}
      src="/assets/logo.svg"
      width={width}
      height={height}
      priority={priority}
      unoptimized
    />
  );
}
