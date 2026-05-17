import type { ReactNode } from "react";
import { DesignDock } from "@/features/design-lab/design-dock";

export default function DesignLabLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <DesignDock />
    </>
  );
}
