import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { RootShell } from "@/components/layout/root-shell";

export const metadata: Metadata = {
  title: "Gateworks",
  description:
    "Operating platform for ornamental iron suppliers, gate shops, fence companies, welding companies, and metal supply businesses."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <RootShell>{children}</RootShell>
      </body>
    </html>
  );
}
