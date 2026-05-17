import type { Metadata } from "next";
import type { ReactNode } from "react";
import { UserStorageScope } from "@/components/user-storage-scope";
import { IndustrialAdminShell } from "@/features/sites/industrial/admin/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Operations | Gateworks Industrial Supply",
    template: "%s | Gateworks Operations"
  }
};

export default function IndustrialAdminLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <>
      <UserStorageScope />
      <IndustrialAdminShell>{children}</IndustrialAdminShell>
    </>
  );
}
