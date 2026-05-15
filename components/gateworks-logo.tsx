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
    <img
      alt="Gateworks"
      className={clsx("h-auto w-auto object-contain", variantClass, className)}
      height={height}
      src="/assets/logo.svg"
      width={width}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
